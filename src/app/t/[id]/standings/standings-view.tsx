"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Trophy, Medal, BarChart3, Users } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"
import { computeStandings, computeBillboard } from "@/lib/scoring"
import { startCup } from "@/lib/actions"
import { useRouter } from "next/navigation"

type TournamentData = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions").getTournament>>>

interface Props {
  tournament: TournamentData
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export function StandingsView({ tournament }: Props) {
  const router = useRouter()
  const { t, dir } = useLocale()

  const leagueMatches = tournament.matches.filter((m) => m.phase === "league")
  const standings = computeStandings(tournament.teams, leagueMatches as any)
  const billboard = computeBillboard(
    tournament.players as any,
    tournament.teams as any,
    leagueMatches as any
  )

  const completedLeagueMatches = leagueMatches.filter((m) => m.status === "completed")
  const allLeagueMatches = leagueMatches.length
  const leagueComplete = completedLeagueMatches.length >= allLeagueMatches && allLeagueMatches > 0

  const top4 = standings.slice(0, 4)

  async function handleStartCup() {
    if (top4.length < 4) return
    try {
      await startCup(tournament.id, top4.map((s) => s.teamId))
      toast.success("Cup phase started!")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start cup")
    }
  }

  const rankEmoji = (i: number) => {
    if (i === 0) return "🥇"
    if (i === 1) return "🥈"
    if (i === 2) return "🥉"
    return ""
  }

  return (
    <div className="space-y-6" dir={dir}>
      <motion.div
        className="flex items-center justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={itemVariants} className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> {tournament.title} — {t.standings.title}
        </motion.h1>
        <motion.div variants={itemVariants}>
          <Button variant="outline" render={<a href={`/t/${tournament.id}`}>{t.standings.back}</a>} />
        </motion.div>
      </motion.div>

      <Tabs defaultValue="standings">
        <TabsList>
          <TabsTrigger value="standings" className="flex items-center gap-1">
            <Medal className="h-4 w-4" /> {t.standings.leagueTable}
          </TabsTrigger>
          <TabsTrigger value="billboard" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" /> {t.standings.billboard}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="space-y-4">
          {standings.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">{t.standings.pos}</th>
                          <th className="text-left p-3 font-medium">{t.standings.team}</th>
                          <th className="text-center p-3 font-medium">{t.standings.P}</th>
                          <th className="text-center p-3 font-medium">{t.standings.W}</th>
                          <th className="text-center p-3 font-medium">{t.standings.D}</th>
                          <th className="text-center p-3 font-medium">{t.standings.L}</th>
                          <th className="text-center p-3 font-medium">{t.standings.Pts}</th>
                          <th className="text-center p-3 font-medium">{t.standings.SD}</th>
                          <th className="text-center p-3 font-medium">{t.standings.GD}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s, i) => (
                          <motion.tr
                            key={s.teamId}
                            variants={itemVariants}
                            className={`border-b hover:bg-muted/30 transition-colors ${i < 4 ? "bg-primary/5" : ""}`}
                          >
                            <td className="p-3 font-medium">
                              {rankEmoji(i) || `${i + 1}`}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{s.teamName}</div>
                              <div className="text-xs text-muted-foreground">{s.players.join(", ")}</div>
                            </td>
                            <td className="text-center p-3">{s.played}</td>
                            <td className="text-center p-3">{s.wins}</td>
                            <td className="text-center p-3">{s.draws}</td>
                            <td className="text-center p-3">{s.losses}</td>
                            <td className="text-center p-3 font-bold">{s.points}</td>
                            <td className="text-center p-3">{s.setDiff > 0 ? "+" : ""}{s.setDiff}</td>
                            <td className="text-center p-3">{s.gameDiff > 0 ? "+" : ""}{s.gameDiff}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {t.standings.noMatches}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t.standings.completed}: {completedLeagueMatches.length}/{allLeagueMatches}
              {leagueComplete && " ✓"}
            </span>
          </div>

          {leagueComplete && top4.length >= 4 && (tournament.mode === "league_cup" || tournament.mode === "cup") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="text-lg text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Trophy className="h-5 w-5" /> {t.standings.leagueComplete}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {top4.map((s, i) => (
                      <div key={s.teamId} className="border rounded-lg p-3 bg-background flex items-center gap-2">
                        <span className="text-lg">{rankEmoji(i)}</span>
                        <div>
                          <div className="font-medium text-sm">{s.teamName}</div>
                          <div className="text-xs text-muted-foreground">{s.points} {t.standings.Pts}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleStartCup} className="w-full">
                    {t.standings.startCup}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="billboard">
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" /> {t.standings.topPlayers}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {billboard.topPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {billboard.topPlayers.slice(0, 10).map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6">{rankEmoji(i) || `${i + 1}.`}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {p.wins}W / {p.matches}M · {(p.winRate * 100).toFixed(0)}%
                            {p.streak > 1 && <Badge variant="secondary" className="text-xs">🔥{p.streak}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.standings.noData}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" /> {t.standings.topTeams}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {billboard.topTeams.length > 0 ? (
                    <div className="space-y-2">
                      {billboard.topTeams.slice(0, 10).map((t, i) => (
                        <div key={t.id} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6">{rankEmoji(i) || `${i + 1}.`}</span>
                            <span className="font-medium">{t.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {t.wins}W / {t.matches}M · {(t.winRate * 100).toFixed(0)}%
                            {t.streak > 1 && <Badge variant="secondary" className="text-xs">🔥{t.streak}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.standings.noData}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
