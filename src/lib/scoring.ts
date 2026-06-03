export type SetScore = { team1: number; team2: number }

export interface MatchResult {
  team1Sets: number
  team2Sets: number
  sets: SetScore[]
  winner: "team1" | "team2" | null
  isComplete: boolean
}

/**
 * Determines set winner based on tennis/padel scoring
 * Classic Advantage deuce: win by 2, no cap
 */
export function getSetWinner(score: SetScore): 1 | 2 | null {
  const { team1: t1, team2: t2 } = score
  if (t1 === null || t2 === null) return null
  if (t1 < 6 && t2 < 6) return null

  const diff = Math.abs(t1 - t2)
  const max = Math.max(t1, t2)
  const min = Math.min(t1, t2)

  const won =
    (max >= 6 && diff >= 2) ||
    (max === 7 && min === 6 && diff === 1)

  if (!won) return null
  return t1 > t2 ? 1 : 2
}

/**
 * Computes full match result from all sets
 * Best of 3 sets
 */
export function getMatchResult(sets: SetScore[]): MatchResult {
  let team1Sets = 0
  let team2Sets = 0

  for (const set of sets) {
    const winner = getSetWinner(set)
    if (winner === 1) team1Sets++
    else if (winner === 2) team2Sets++
  }

  const isComplete = team1Sets >= 2 || team2Sets >= 2
  const winner = isComplete
    ? team1Sets >= 2 ? "team1" as const : "team2" as const
    : null

  return { team1Sets, team2Sets, sets, winner, isComplete }
}

/**
 * Computes set difference for tiebreaking
 */
export function getSetDifference(sets: SetScore[]): number {
  let t1 = 0
  let t2 = 0
  for (const set of sets) {
    const w = getSetWinner(set)
    if (w === 1) t1++
    else if (w === 2) t2++
  }
  return t1 - t2
}

/**
 * Computes total game difference across all sets
 */
export function getGameDifference(sets: SetScore[]): number {
  let diff = 0
  for (const set of sets) {
    if (set.team1 !== null && set.team2 !== null) {
      diff += set.team1 - set.team2
    }
  }
  return diff
}

export interface Standing {
  teamId: string
  teamName: string
  players: string[]
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  setsFor: number
  setsAgainst: number
  setDiff: number
  gamesFor: number
  gamesAgainst: number
  gameDiff: number
}

export function computeStandings(
  teams: { id: string; name: string; members: { player: { name: string } }[] }[],
  matches: {
    team1Id: string | null
    team2Id: string | null
    status: string
    sets: { setNumber: number; team1Score: number | null; team2Score: number | null }[]
  }[]
): Standing[] {
  const standingsMap = new Map<string, Standing>()

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      players: team.members.map((m) => m.player.name),
      played: 0, wins: 0, draws: 0, losses: 0, points: 0,
      setsFor: 0, setsAgainst: 0, setDiff: 0,
      gamesFor: 0, gamesAgainst: 0, gameDiff: 0,
    })
  }

  for (const match of matches) {
    if (match.status !== "completed") continue
    if (!match.team1Id || !match.team2Id) continue

    const t1 = standingsMap.get(match.team1Id)
    const t2 = standingsMap.get(match.team2Id)
    if (!t1 || !t2) continue

    const result = getMatchResult(match.sets.map((s) => ({
      team1: s.team1Score ?? 0,
      team2: s.team2Score ?? 0,
    })))

    t1.played++
    t2.played++

    if (result.winner === "team1") {
      t1.wins++; t1.points += 3
      t2.losses++
    } else if (result.winner === "team2") {
      t2.wins++; t2.points += 3
      t1.losses++
    } else {
      t1.draws++; t2.draws++
      t1.points += 1; t2.points += 1
    }

    for (const set of match.sets) {
      if (set.team1Score !== null && set.team2Score !== null) {
        const w = getSetWinner({ team1: set.team1Score, team2: set.team2Score })
        if (w === 1) { t1.setsFor++; t2.setsAgainst++ }
        else if (w === 2) { t2.setsFor++; t1.setsAgainst++ }
        t1.gamesFor += set.team1Score; t1.gamesAgainst += set.team2Score
        t2.gamesFor += set.team2Score; t2.gamesAgainst += set.team1Score
      }
    }
  }

  for (const s of standingsMap.values()) {
    s.setDiff = s.setsFor - s.setsAgainst
    s.gameDiff = s.gamesFor - s.gamesAgainst
  }

  return Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
    return b.gamesFor - a.gamesFor
  })
}

/**
 * FFA mode: compute individual standing from all FFA matches
 */
export function computeFFAStandings(
  players: { id: string; name: string }[],
  matches: {
    ffaPlayer1Id: string | null
    ffaPlayer2Id: string | null
    ffaPlayer3Id: string | null
    ffaPlayer4Id: string | null
    status: string
    sets: { team1Score: number | null; team2Score: number | null }[]
  }[]
) {
  const points = new Map<string, number>()
  for (const p of players) points.set(p.id, 0)

  for (const match of matches) {
    if (match.status !== "completed") continue
    if (!match.ffaPlayer1Id || !match.ffaPlayer3Id) continue

    const t1Score = match.sets?.[0]?.team1Score ?? 0
    const t2Score = match.sets?.[0]?.team2Score ?? 0

    const p1 = points.get(match.ffaPlayer1Id)
    const p2val = match.ffaPlayer2Id ? points.get(match.ffaPlayer2Id) : undefined
    const p3 = points.get(match.ffaPlayer3Id)
    const p4val = match.ffaPlayer4Id ? points.get(match.ffaPlayer4Id) : undefined

    if (p1 !== undefined) points.set(match.ffaPlayer1Id, p1 + t1Score)
    if (p2val !== undefined && match.ffaPlayer2Id) points.set(match.ffaPlayer2Id, p2val + t1Score)
    if (p3 !== undefined) points.set(match.ffaPlayer3Id, p3 + t2Score)
    if (p4val !== undefined && match.ffaPlayer4Id) points.set(match.ffaPlayer4Id, p4val + t2Score)
  }

  return Array.from(points.entries())
    .map(([playerId, total]) => {
      const player = players.find((p) => p.id === playerId)
      return { playerId, playerName: player?.name ?? "Unknown", total }
    })
    .sort((a, b) => b.total - a.total)
}

/**
 * Compute billboard stats: best individuals and teams across all completed matches
 */
export function computeBillboard(
  players: { id: string; name: string; isGhost: boolean }[],
  teams: { id: string; name: string; members: { player: { id: string; name: string } }[] }[],
  matches: {
    team1Id: string | null
    team2Id: string | null
    status: string
    winnerId: string | null
    sets: { team1Score: number | null; team2Score: number | null }[]
  }[]
) {
  const playerWins = new Map<string, { wins: number; matches: number; streak: number; currentStreak: number }>()
  const teamWins = new Map<string, { wins: number; matches: number; streak: number; currentStreak: number }>()

  for (const p of players) {
    if (!p.isGhost) playerWins.set(p.id, { wins: 0, matches: 0, streak: 0, currentStreak: 0 })
  }
  for (const t of teams) {
    teamWins.set(t.id, { wins: 0, matches: 0, streak: 0, currentStreak: 0 })
  }

  for (const match of matches) {
    if (match.status !== "completed") continue
    if (!match.winnerId) continue

    const team = teams.find((t) => t.id === match.winnerId)
    if (team) {
      for (const member of team.members) {
        const ps = playerWins.get(member.player.id)
        if (ps) {
          ps.wins++
          ps.matches++
          ps.currentStreak++
          if (ps.currentStreak > ps.streak) ps.streak = ps.currentStreak
        }
      }
    }

    const losingTeamId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id
    const losingTeam = teams.find((t) => t.id === losingTeamId)
    if (losingTeam) {
      for (const member of losingTeam.members) {
        const ps = playerWins.get(member.player.id)
        if (ps) {
          ps.matches++
          ps.currentStreak = 0
        }
      }
    }

    const ts = teamWins.get(match.winnerId ?? "")
    if (ts) {
      ts.wins++
      ts.matches++
      ts.currentStreak++
      if (ts.currentStreak > ts.streak) ts.streak = ts.currentStreak
    }
    const losingTeamStats = teamWins.get(losingTeamId ?? "")
    if (losingTeamStats) {
      losingTeamStats.matches++
      losingTeamStats.currentStreak = 0
    }
  }

  const topPlayers = Array.from(playerWins.entries())
    .map(([id, s]) => ({ id, name: players.find((p) => p.id === id)?.name ?? "", ...s, winRate: s.matches > 0 ? s.wins / s.matches : 0 }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)

  const topTeams = Array.from(teamWins.entries())
    .map(([id, s]) => ({ id, name: teams.find((t) => t.id === id)?.name ?? "", ...s, winRate: s.matches > 0 ? s.wins / s.matches : 0 }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)

  return { topPlayers, topTeams }
}
