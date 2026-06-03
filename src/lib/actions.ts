"use server"

import { prisma } from "./prisma"
import { generateCode, generateShareCode, randomPlayerName, generateTeamName } from "./utils"
import {
  generateRoundRobinPairings,
  generateTwoLegPairings,
  assignMatchesToSlots,
  generateFFARotation,
} from "./scheduling"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Match } from "@prisma/client"
import { getMatchResult } from "./scoring"

export async function createTournament(formData: FormData) {
  const title = (formData.get("title") as string) || new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
  const mode = formData.get("mode") as string
  const legCount = parseInt(formData.get("legCount") as string) || 1
  const courtCount = parseInt(formData.get("courtCount") as string) || 1
  const deuceRule = formData.get("deuceRule") as string || "classic_advantage"
  const playerNamesRaw = formData.get("playerNames") as string
  const targetScore = parseInt(formData.get("targetScore") as string) || 24

  const playerNames = playerNamesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  if (playerNames.length < 2) {
    throw new Error("At least 2 players required")
  }

  const creatorCode = generateCode()
  const tournament = await prisma.tournament.create({
    data: {
      title,
      mode,
      legCount,
      courtCount,
      deuceRule,
      targetScore,
      creatorCode,
      players: {
        create: playerNames.map((name) => ({ name })),
      },
    },
    include: { players: true },
  })

  // Auto-pair teams for League/Cup modes
  if (mode === "league_cup" || mode === "cup") {
    let players = [...tournament.players]
    let isGhostAdded = false

    if (players.length % 2 !== 0) {
      const ghost = await prisma.player.create({
        data: { name: randomPlayerName(), isGhost: true, tournamentId: tournament.id },
      })
      players.push(ghost)
      isGhostAdded = true
    }

    // Shuffle and pair
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i]
      const p2 = shuffled[i + 1]
      if (!p2) break

      await prisma.team.create({
        data: {
          name: generateTeamName(p1.name, p2.name),
          tournamentId: tournament.id,
          members: {
            create: [
              { playerId: p1.id },
              { playerId: p2.id },
            ],
          },
        },
      })
    }
  }

  return { id: tournament.id, creatorCode }
}

export async function startLeague(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { members: { include: { player: true } } } },
    },
  })
  if (!tournament) throw new Error("Tournament not found")

  const teams = tournament.teams.map((t) => ({ id: t.id, name: t.name }))
  const pairings = tournament.legCount === 2
    ? generateTwoLegPairings(teams)
    : generateRoundRobinPairings(teams)

  const matchesWithIndices = pairings.map((p, i) => ({ ...p, matchIndex: i }))
  const teamIds = teams.map((t) => t.id)
  const slotAssignments = assignMatchesToSlots(matchesWithIndices, teamIds, tournament.courtCount)

  const shareCodeMap = new Map<string, string>()

  for (const sa of slotAssignments) {
    const pairing = pairings[sa.matchIndex]
    const shareCode = generateShareCode()
    shareCodeMap.set(shareCode, pairing.team1Id)

    await prisma.match.create({
      data: {
        tournamentId,
        round: sa.slot,
        phase: "league",
        status: "pending",
        team1Id: pairing.team1Id,
        team2Id: pairing.team2Id,
        shareCode,
        creatorCode: tournament.creatorCode,
      },
    })
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "in_progress" },
  })

  revalidatePath(`/t/${tournamentId}`)
}

export async function startCup(tournamentId: string, finalFourTeamIds: string[]) {
  // Create cup bracket for top 4 teams
  // Semi 1: 1st vs 4th (bracketPosition 1)
  // Semi 2: 2nd vs 3rd (bracketPosition 2)
  // Final: Winner semi 1 vs Winner semi 2 (bracketPosition 3)
  // 3rd place: Loser semi 1 vs Loser semi 2 (bracketPosition 4)

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })
  if (!tournament) throw new Error("Tournament not found")

  const [t1, t4, t2, t3] = finalFourTeamIds

  const semi1 = await prisma.match.create({
    data: {
      tournamentId,
      round: 0,
      phase: "cup_semi",
      status: "pending",
      team1Id: t1,
      team2Id: t4,
      shareCode: generateShareCode(),
      bracketPosition: 1,
      creatorCode: tournament.creatorCode,
    },
  })

  const semi2 = await prisma.match.create({
    data: {
      tournamentId,
      round: 0,
      phase: "cup_semi",
      status: "pending",
      team1Id: t2,
      team2Id: t3,
      shareCode: generateShareCode(),
      bracketPosition: 2,
      creatorCode: tournament.creatorCode,
    },
  })

  // Final
  await prisma.match.create({
    data: {
      tournamentId,
      round: 1,
      phase: "cup_final",
      status: "pending",
      shareCode: generateShareCode(),
      bracketPosition: 3,
      parentMatchId: semi1.id,
      creatorCode: tournament.creatorCode,
    },
  })

  // 3rd place
  await prisma.match.create({
    data: {
      tournamentId,
      round: 1,
      phase: "cup_3rd_place",
      status: "pending",
      shareCode: generateShareCode(),
      bracketPosition: 4,
      parentMatchId: semi2.id,
      creatorCode: tournament.creatorCode,
    },
  })

  revalidatePath(`/t/${tournamentId}/cup`)
}

export async function updateMatchScore(
  matchId: string,
  sets: { setNumber: number; team1Score: number | null; team2Score: number | null }[]
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { sets: true },
  })
  if (!match) throw new Error("Match not found")

  // Delete existing sets and recreate
  await prisma.setScore.deleteMany({ where: { matchId } })

  for (const set of sets) {
    await prisma.setScore.create({
      data: {
        matchId,
        setNumber: set.setNumber,
        team1Score: set.team1Score,
        team2Score: set.team2Score,
      },
    })
  }

  // Determine winner
  const allSets = await prisma.setScore.findMany({
    where: { matchId },
    orderBy: { setNumber: "asc" },
  })
  const result = getMatchResult(
    allSets.map((s) => ({ team1: s.team1Score ?? 0, team2: s.team2Score ?? 0 }))
  )

  const status = result.isComplete ? "completed" : "in_progress"
  const winnerId = result.winner === "team1" ? match.team1Id
    : result.winner === "team2" ? match.team2Id
    : null

  await prisma.match.update({
    where: { id: matchId },
    data: { status, winnerId, version: { increment: 1 } },
  })

  // If cup match completed, propagate to next round
  if (result.isComplete && (match.phase === "cup_semi" || match.phase === "cup_final")) {
    await propagateCupWinner(match)
  }

  revalidatePath(`/m/${match.shareCode}`)
  revalidatePath(`/t/${match.tournamentId}`)
}

async function propagateCupWinner(match: Match) {
  if (!match.winnerId) return
  if (match.phase !== "cup_semi") return

  const [finalMatch, thirdPlaceMatch] = await Promise.all([
    prisma.match.findFirst({ where: { tournamentId: match.tournamentId, phase: "cup_final" } }),
    prisma.match.findFirst({ where: { tournamentId: match.tournamentId, phase: "cup_3rd_place" } }),
  ])

  if (match.bracketPosition === 1) {
    // Semi 1: winner → final team1, loser → 3rd place team1
    if (finalMatch) {
      await prisma.match.update({ where: { id: finalMatch.id }, data: { team1Id: match.winnerId } })
    }
    // Loser is the other team
    const loserId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id
    if (thirdPlaceMatch && loserId) {
      await prisma.match.update({ where: { id: thirdPlaceMatch.id }, data: { team1Id: loserId } })
    }
  } else if (match.bracketPosition === 2) {
    // Semi 2: winner → final team2, loser → 3rd place team2
    if (finalMatch) {
      await prisma.match.update({ where: { id: finalMatch.id }, data: { team2Id: match.winnerId } })
    }
    const loserId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id
    if (thirdPlaceMatch && loserId) {
      await prisma.match.update({ where: { id: thirdPlaceMatch.id }, data: { team2Id: loserId } })
    }
  }
}

export async function editMatchScore(
  matchId: string,
  oldSets: { setNumber: number; team1Score: number | null; team2Score: number | null }[],
  newSets: { setNumber: number; team1Score: number | null; team2Score: number | null }[]
) {
  // Save audit log
  await prisma.scoreEdit.create({
    data: {
      matchId,
      oldData: JSON.stringify(oldSets),
      newData: JSON.stringify(newSets),
    },
  })

  await updateMatchScore(matchId, newSets)
}

export async function editTeams(tournamentId: string, newTeamAssignments: { teamName: string; playerIds: string[] }[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { matches: { take: 1, where: { status: { not: "pending" } } } },
  })
  if (!tournament) throw new Error("Tournament not found")
  if (tournament.matches.length > 0) {
    throw new Error("Cannot edit teams after tournament has started")
  }

  // Delete existing team members and teams
  const existingTeams = await prisma.team.findMany({
    where: { tournamentId },
    include: { members: true },
  })
  for (const team of existingTeams) {
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
  }
  await prisma.team.deleteMany({ where: { tournamentId } })

  // Create new teams
  for (const assignment of newTeamAssignments) {
    await prisma.team.create({
      data: {
        name: assignment.teamName,
        tournamentId,
        members: {
          create: assignment.playerIds.map((playerId) => ({ playerId })),
        },
      },
    })
  }

  revalidatePath(`/t/${tournamentId}`)
}

export async function getTournament(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: true,
      teams: {
        include: { members: { include: { player: true } } },
      },
      matches: {
        include: { sets: { orderBy: { setNumber: "asc" } } },
        orderBy: [{ round: "asc" }],
      },
    },
  })
}

export async function getMatchByShareCode(shareCode: string) {
  return prisma.match.findUnique({
    where: { shareCode },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      team1: { include: { members: { include: { player: true } } } },
      team2: { include: { members: { include: { player: true } } } },
      tournament: true,
      edits: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function startFFA(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  })
  if (!tournament) throw new Error("Tournament not found")

  const playerIds = tournament.players.map((p) => p.id)

  // If odd number of players, add a ghost
  let allPlayers = [...tournament.players]
  if (allPlayers.length % 2 !== 0) {
    const ghost = await prisma.player.create({
      data: { name: randomPlayerName(), isGhost: true, tournamentId },
    })
    allPlayers.push(ghost)
  }

  const rotation = generateFFARotation(allPlayers.map((p) => p.id))

  for (const r of rotation) {
    await prisma.match.create({
      data: {
        tournamentId,
        round: r.round,
        phase: "ffa",
        status: "pending",
        ffaPlayer1Id: r.player1Id,
        ffaPlayer2Id: r.player2Id,
        ffaPlayer3Id: r.player3Id,
        ffaPlayer4Id: r.player4Id,
        shareCode: generateShareCode(),
        creatorCode: tournament.creatorCode,
      },
    })
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "in_progress" },
  })

  revalidatePath(`/t/${tournamentId}`)
}

export async function updateFFAMatchScore(
  matchId: string,
  team1Score: number,
  team2Score: number
) {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) throw new Error("Match not found")

  // Delete existing sets
  await prisma.setScore.deleteMany({ where: { matchId } })

  await prisma.setScore.create({
    data: {
      matchId,
      setNumber: 1,
      team1Score,
      team2Score,
    },
  })

  const status = team1Score > 0 || team2Score > 0 ? "completed" : "pending"

  await prisma.match.update({
    where: { id: matchId },
    data: { status, version: { increment: 1 } },
  })

  revalidatePath(`/m/${match.shareCode}`)
  revalidatePath(`/t/${match.tournamentId}`)
}

export async function updateTournamentSettings(formData: FormData) {
  const tournamentId = formData.get("tournamentId") as string
  const title = formData.get("title") as string
  const deuceRule = formData.get("deuceRule") as string
  const legCount = parseInt(formData.get("legCount") as string) || 1
  const creatorCode = formData.get("creatorCode") as string

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
  if (!tournament) throw new Error("Tournament not found")
  if (tournament.creatorCode !== creatorCode) throw new Error("Only the creator can edit settings")
  if (tournament.status !== "setup") throw new Error("Cannot change settings after tournament has started")

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      title,
      deuceRule,
      legCount: tournament.mode === "league_cup" ? legCount : tournament.legCount,
    },
  })

  revalidatePath(`/t/${tournamentId}`)
  revalidatePath(`/t/${tournamentId}/settings`)
}

export async function deleteMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) throw new Error("Match not found")

  const tournamentId = match.tournamentId

  await prisma.match.delete({ where: { id: matchId } })

  revalidatePath(`/t/${tournamentId}`)
}
