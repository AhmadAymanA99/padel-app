export interface TeamInSchedule {
  id: string
  name: string
}

export interface ScheduledMatch {
  team1Id: string
  team2Id: string
  round: number
}

/**
 * Generate round-robin pairings using Circle Method
 * Returns all matches for a single round-robin (1 leg)
 */
export function generateRoundRobinPairings(teams: TeamInSchedule[]): ScheduledMatch[] {
  const n = teams.length
  if (n < 2) return []

  // If odd number of teams, add a dummy (bye)
  const ids = teams.map((t) => t.id)
  let teamIds = [...ids]
  let hasBye = false
  if (n % 2 !== 0) {
    teamIds.push("BYE")
    hasBye = true
  }

  const totalTeams = teamIds.length
  const rounds = totalTeams - 1
  const matches: ScheduledMatch[] = []

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < totalTeams / 2; i++) {
      const t1 = teamIds[i]
      const t2 = teamIds[totalTeams - 1 - i]

      if (t1 === "BYE" || t2 === "BYE") continue

      // Alternate home/away by round to balance
      if (round % 2 === 0) {
        matches.push({ team1Id: t1, team2Id: t2, round })
      } else {
        matches.push({ team1Id: t2, team2Id: t1, round })
      }
    }

    // Rotate: keep first fixed, rotate rest clockwise
    const fixed = teamIds[0]
    const rest = teamIds.slice(1)
    const last = rest.pop()!
    teamIds = [fixed, last, ...rest]
  }

  return matches
}

/**
 * For 2-leg league: duplicate and swap home/away
 */
export function generateTwoLegPairings(teams: TeamInSchedule[]): ScheduledMatch[] {
  const firstLeg = generateRoundRobinPairings(teams)
  const secondLeg = firstLeg.map((m) => ({
    team1Id: m.team2Id,
    team2Id: m.team1Id,
    round: m.round + (firstLeg.length / (teams.length / 2)),
  }))
  return [...firstLeg, ...secondLeg]
}

export interface FairScheduleInput {
  teamId: string
  matchCount: number
}

/**
 * Longest Waiting First (LWF) scheduling algorithm
 * Assigns matches to time slots minimizing wait time variance
 */
export function assignMatchesToSlots(
  allMatches: { team1Id: string; team2Id: string; round: number; matchIndex: number }[],
  teamIds: string[],
  courtsCount: number
): { matchIndex: number; slot: number; court: number }[] {
  const assignments: { matchIndex: number; slot: number; court: number }[] = []
  const pending = [...allMatches]
  const waitTime = new Map<string, number>()
  const lastSlotPlayed = new Map<string, number>()

  for (const id of teamIds) {
    waitTime.set(id, 0)
    lastSlotPlayed.set(id, -2)
  }

  let slot = 0

  while (pending.length > 0) {
    const courtsAvailable = courtsCount
    const playedThisSlot = new Set<string>()
    const chosen: typeof pending = []

    for (let c = 0; c < courtsAvailable && pending.length > 0; c++) {
      // Find match with highest combined wait time among eligible teams
      let bestIdx = -1
      let bestScore = -1

      for (let i = 0; i < pending.length; i++) {
        const m = pending[i]
        const t1Wait = waitTime.get(m.team1Id) ?? 0
        const t2Wait = waitTime.get(m.team2Id) ?? 0

        if (playedThisSlot.has(m.team1Id) || playedThisSlot.has(m.team2Id)) continue

        // Prefer higher combined wait time
        const combinedWait = t1Wait + t2Wait
        if (combinedWait > bestScore) {
          bestScore = combinedWait
          bestIdx = i
        }
      }

      if (bestIdx === -1) break

      const match = pending.splice(bestIdx, 1)[0]
      chosen.push(match)
      playedThisSlot.add(match.team1Id)
      playedThisSlot.add(match.team2Id)

      assignments.push({
        matchIndex: match.matchIndex,
        slot,
        court: c,
      })
    }

    // Update wait times
    for (const id of teamIds) {
      const current = waitTime.get(id) ?? 0
      waitTime.set(id, current + 1)
    }
    for (const m of chosen) {
      waitTime.set(m.team1Id, 0)
      waitTime.set(m.team2Id, 0)
      lastSlotPlayed.set(m.team1Id, slot)
      lastSlotPlayed.set(m.team2Id, slot)
    }

    slot++
  }

  return assignments
}

/**
 * Generate FFA (Americano) rotation schedule
 * Every player partners with every other player exactly once
 */
export function generateFFARotation(playerIds: string[]): {
  round: number
  court: number
  player1Id: string
  player2Id: string
  player3Id: string
  player4Id: string
}[] {
  const n = playerIds.length
  if (n < 4) return []
  if (n % 4 !== 0) {
    // Not a multiple of 4 - will have sit-outs
  }

  const ids = [...playerIds]
  const rounds: {
    round: number
    court: number
    player1Id: string
    player2Id: string
    player3Id: string
    player4Id: string
  }[] = []

  // Circle method for partnerships
  // For N players, we need N-1 rounds if N is even
  // Each player partners with every other player once
  const totalRounds = ids.length % 2 === 0 ? ids.length - 1 : ids.length

  for (let round = 0; round < totalRounds; round++) {
    const courtsCount = Math.floor(ids.length / 4)
    for (let c = 0; c < courtsCount; c++) {
      const i = c * 4
      if (i + 3 < ids.length) {
        rounds.push({
          round,
          court: c,
          player1Id: ids[i],
          player2Id: ids[i + 1],
          player3Id: ids[i + 2],
          player4Id: ids[i + 3],
        })
      }
    }

    // Rotate for next round
    const fixed = ids[0]
    const rest = ids.slice(1)
    const last = rest.pop()!
    ids.splice(0, ids.length, fixed, last, ...rest)
  }

  return rounds
}
