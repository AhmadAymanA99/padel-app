"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Share2, Check, Trash2, Settings, Trophy, BarChart3, Play, Users } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"
import { startLeague, startFFA, deleteMatch, editTeams } from "@/lib/actions"

function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }, [])
  return { copy, copiedId }
}

type TournamentData = Awaited<ReturnType<typeof import("@/lib/actions").getTournament>>

interface Props {
  tournament: NonNullable<TournamentData>
}

function containerVariants(delay = 0.05) {
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: delay } },
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export function TournamentDashboard({ tournament }: Props) {
  const router = useRouter()
  const { t, dir } = useLocale()
  const [creatorCode, setCreatorCode] = useState<string | null>(null)
  const [showEditTeams, setShowEditTeams] = useState(false)
  const { copy, copiedId } = useCopy()
  const isCreator = creatorCode !== null

  useEffect(() => {
    const code = sessionStorage.getItem(`creator_${tournament.id}`)
    setCreatorCode(code)
  }, [tournament.id])

  async function handleStartLeague() {
    try {
      await startLeague(tournament.id)
      toast.success(t.status.inProgress)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start")
    }
  }

  async function handleStartFFA() {
    try {
      await startFFA(tournament.id)
      toast.success("Free-for-All started!")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start")
    }
  }

  async function handleDeleteMatch(matchId: string) {
    try {
      await deleteMatch(matchId)
      toast.success("Match deleted")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  const pendingMatches = tournament.matches.filter((m) => m.status === "pending")
  const activeMatches = tournament.matches.filter((m) => m.status === "in_progress")
  const completedMatches = tournament.matches.filter((m) => m.status === "completed")

  const tournamentUrl = typeof window !== "undefined" ? `${window.location.origin}/t/${tournament.id}` : ""

  const modeLabel =
    tournament.mode === "league_cup" ? t.home.leagueCup
    : tournament.mode === "cup" ? t.home.cup
    : t.home.ffa

  const statusLabel =
    tournament.status === "setup" ? t.status.setup
    : tournament.status === "in_progress" ? t.status.inProgress
    : t.status.completed

  return (
    <div className="space-y-6" dir={dir}>
      <motion.div className="flex items-start justify-between gap-4" variants={containerVariants()} initial="hidden" animate="show">
        <motion.div className="min-w-0" variants={itemVariants}>
          <h1 className="text-2xl font-bold truncate">{tournament.title}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" /> {modeLabel}
            {tournament.legCount > 1 && ` · ${tournament.legCount} legs`}
            {tournament.courtCount > 1 && ` · ${tournament.courtCount} courts`}
          </p>
        </motion.div>
        <motion.div className="flex items-center gap-2 shrink-0" variants={itemVariants}>
          <Button variant="outline" size="sm" onClick={() => copy(tournamentUrl, "tournament")}>
            {copiedId === "tournament" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {t.dashboard.share}
          </Button>
          <Badge variant={tournament.status === "setup" ? "secondary" : tournament.status === "in_progress" ? "default" : "outline"}>
            {statusLabel}
          </Badge>
        </motion.div>
      </motion.div>

      {isCreator && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t.dashboard.yourCreatorCode}:</span>
              <code className="font-mono text-foreground bg-background px-2 py-0.5 rounded text-xs border">{creatorCode}</code>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => copy(creatorCode!, "code")}
              >
                {copiedId === "code" ? t.dashboard.copied : t.dashboard.copyCode}
              </button>
              <span className="text-xs text-muted-foreground">· {t.dashboard.saveCode}</span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Teams */}
      {tournament.teams.length > 0 && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> {t.dashboard.teams}
              </CardTitle>
              {isCreator && tournament.status === "setup" && (
                <Button variant="outline" size="sm" onClick={() => setShowEditTeams(!showEditTeams)}>
                  {showEditTeams ? t.dashboard.doneEditing : t.dashboard.editTeams}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showEditTeams && isCreator ? (
                <EditTeamsForm
                  tournamentId={tournament.id}
                  teams={tournament.teams}
                  players={tournament.players}
                  onSaved={() => { setShowEditTeams(false); router.refresh() }}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tournament.teams.map((team) => (
                    <motion.div
                      key={team.id}
                      variants={itemVariants}
                      className="border rounded-lg p-3 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="font-medium text-sm">{team.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {team.members.map((m) => m.player.name).join(" + ")}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Players (FFA) */}
      {tournament.mode === "free_for_all" && tournament.players.length > 0 && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> {t.dashboard.players}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tournament.players.map((p) => (
                  <Badge key={p.id} variant={p.isGhost ? "secondary" : "default"} className="text-xs">
                    {p.name}{p.isGhost ? " (auto)" : ""}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Start tournament */}
      {tournament.status === "setup" && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" /> {t.dashboard.startLeague}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {tournament.mode === "free_for_all"
                  ? "Generate the rotation schedule and start the tournament."
                  : "Generate the match schedule using the fair scheduling algorithm."}
              </p>
              <div className="flex gap-3">
                {tournament.mode === "free_for_all" ? (
                  <Button onClick={handleStartFFA}>{t.dashboard.startFFA}</Button>
                ) : (
                  <Button onClick={handleStartLeague}>{t.dashboard.startLeague}</Button>
                )}
                {creatorCode && (
                  <Button variant="outline" render={<a href={`/t/${tournament.id}/standings`} />}>
                    {t.dashboard.standings}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Matches sections */}
      <AnimatePresence>
        {activeMatches.length > 0 && (
          <motion.div variants={containerVariants()} initial="hidden" animate="show" key="active">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.dashboard.activeMatches}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeMatches.map((match) => (
                  <MatchCard key={match.id} match={match} teams={tournament.teams} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingMatches.length > 0 && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t.dashboard.upcomingMatches}</CardTitle>
              <span className="text-sm text-muted-foreground">{pendingMatches.length} {t.dashboard.matchesRemaining}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingMatches.map((match, i) => (
                <motion.div key={match.id} variants={itemVariants}>
                  <MatchCard match={match} teams={tournament.teams} onDelete={isCreator ? handleDeleteMatch : undefined} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {completedMatches.length > 0 && (
        <motion.div variants={containerVariants()} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.completedMatches}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} teams={tournament.teams} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div className="flex gap-3 flex-wrap" variants={containerVariants()} initial="hidden" animate="show">
        {tournament.status !== "setup" && (
          <>
            <motion.div variants={itemVariants}>
              <Button variant="outline" render={<a href={`/t/${tournament.id}/standings`} />}>
                <BarChart3 className="h-4 w-4 mr-1" /> {t.dashboard.standings}
              </Button>
            </motion.div>
            {(tournament.mode === "league_cup" || tournament.mode === "cup") && (
              <motion.div variants={itemVariants}>
                <Button variant="outline" render={<a href={`/t/${tournament.id}/cup`} />}>
                  <Trophy className="h-4 w-4 mr-1" /> {t.dashboard.cupBracket}
                </Button>
              </motion.div>
            )}
          </>
        )}
        {isCreator && tournament.status === "setup" && (
          <motion.div variants={itemVariants}>
            <Button variant="outline" render={<a href={`/t/${tournament.id}/settings`} />}>
              <Settings className="h-4 w-4 mr-1" /> {t.dashboard.settings}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function MatchCard({
  match,
  teams,
  onDelete,
}: {
  match: any
  teams: { id: string; name: string; members: { player: { name: string } }[] }[]
  onDelete?: (id: string) => void
}) {
  const { copy, copiedId } = useCopy()
  const { t } = useLocale()
  const team1 = teams.find((t) => t.id === match.team1Id)
  const team2 = teams.find((t) => t.id === match.team2Id)

  const team1Name = team1?.name ?? (match.ffaPlayer1Id ? "Player" : "TBD")
  const team2Name = team2?.name ?? (match.ffaPlayer3Id ? "Player" : "TBD")

  const setScore =
    match.sets?.length > 0
      ? match.sets
          .map((s: any) => `${s.team1Score ?? "?"}-${s.team2Score ?? "?"}`)
          .join(", ")
      : ""

  const statusBadge = {
    pending: "secondary" as const,
    in_progress: "default" as const,
    completed: "outline" as const,
    skipped: "destructive" as const,
  }

  const statusLabelMap: Record<string, string> = {
    pending: t.status.pending,
    in_progress: t.status.in_progress,
    completed: t.status.completed,
  }

  return (
    <div className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{team1Name}</span>
          <span className="text-muted-foreground shrink-0">{t.match.vs}</span>
          <span className="font-medium truncate">{team2Name}</span>
        </div>
        {setScore && <div className="text-sm text-muted-foreground mt-1">Sets: {setScore}</div>}
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span>Round {match.round}</span>
          <Badge variant={statusBadge[match.status as keyof typeof statusBadge] ?? "secondary"} className="text-[10px] px-1 py-0">
            {statusLabelMap[match.status] ?? match.status}
          </Badge>
          {match.phase !== "league" && <span>· {match.phase.replace("_", " ")}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => copy(`${window.location.origin}/m/${match.shareCode}`, match.id)}>
          {copiedId === match.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button size="sm" variant="outline" render={<a href={`/m/${match.shareCode}`} />}>
          {t.dashboard.viewScore}
        </Button>
        {onDelete && match.status === "pending" && (
          <Button size="sm" variant="destructive" onClick={() => onDelete(match.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function EditTeamsForm({
  tournamentId,
  teams,
  players,
  onSaved,
}: {
  tournamentId: string
  teams: { id: string; name: string; members: { player: { id: string; name: string } }[] }[]
  players: { id: string; name: string }[]
  onSaved: () => void
}) {
  const { t } = useLocale()
  const [assignments, setAssignments] = useState(
    teams.map((t) => ({
      teamName: t.name,
      playerIds: t.members.map((m) => m.player.id),
    }))
  )

  const usedPlayerIds = new Set(assignments.flatMap((a) => a.playerIds))
  const availablePlayers = players.filter((p) => !usedPlayerIds.has(p.id))

  function updateTeam(index: number, playerIds: string[], teamName: string) {
    const updated = [...assignments]
    updated[index] = { teamName, playerIds }
    setAssignments(updated)
  }

  async function handleSave() {
    try {
      const filtered = assignments.filter((a) => a.playerIds.length > 0)
      await editTeams(tournamentId, filtered)
      toast.success("Teams updated")
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error saving teams")
    }
  }

  return (
    <div className="space-y-4">
      {assignments.map((a, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <input
            className="w-full text-sm font-medium border rounded px-2 py-1 bg-background"
            value={a.teamName}
            onChange={(e) => updateTeam(i, a.playerIds, e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {a.playerIds.map((pid) => {
              const player = players.find((p) => p.id === pid)
              return (
                <Badge key={pid} variant="secondary" className="text-xs">
                  {player?.name ?? "Unknown"}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => updateTeam(i, a.playerIds.filter((id) => id !== pid), a.teamName)}
                  >
                    ×
                  </button>
                </Badge>
              )
            })}
          </div>
          <div className="flex gap-1 flex-wrap">
            {availablePlayers.map((p) => (
              <button
                key={p.id}
                className="text-xs px-2 py-0.5 rounded border hover:bg-muted hover:border-primary/50 transition-colors"
                onClick={() => updateTeam(i, [...a.playerIds, p.id], a.teamName)}
              >
                +{p.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={handleSave} className="w-full">{t.dashboard.saveTeams}</Button>
    </div>
  )
}
