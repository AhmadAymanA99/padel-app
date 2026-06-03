"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowLeft } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"

type MatchData = {
  id: string
  phase: string
  status: string
  bracketPosition: number | null
  team1Id: string | null
  team2Id: string | null
  winnerId: string | null
  shareCode: string
  sets: { team1Score: number | null; team2Score: number | null; setNumber: number }[]
}

type TeamData = {
  id: string
  name: string
  members: { player: { name: string } }[]
}

interface Props {
  tournament: {
    id: string
    title: string
    matches: MatchData[]
    teams: TeamData[]
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function CupBracket({ tournament }: Props) {
  const { t, dir } = useLocale()
  const cupMatches = tournament.matches.filter(
    (m) => m.phase === "cup_semi" || m.phase === "cup_final" || m.phase === "cup_3rd_place"
  )

  const getTeam = (id: string | null) => tournament.teams.find((t) => t.id === id)

  const semi1 = cupMatches.find((m) => m.bracketPosition === 1)
  const semi2 = cupMatches.find((m) => m.bracketPosition === 2)
  const finalM = cupMatches.find((m) => m.bracketPosition === 3)
  const thirdPlace = cupMatches.find((m) => m.bracketPosition === 4)

  const BracketMatch = ({ match, label }: { match?: MatchData; label: string }) => {
    if (!match) return null
    const t1 = getTeam(match.team1Id)
    const t2 = getTeam(match.team2Id)
    const isWinner1 = match.winnerId === match.team1Id
    const isWinner2 = match.winnerId === match.team2Id
    const setStr = match.sets?.length > 0
      ? match.sets.map((s) => `${s.team1Score ?? "?"}-${s.team2Score ?? "?"}`).join(", ")
      : ""

    return (
      <motion.div variants={itemVariants}>
        <Card className={`min-w-[220px] transition-colors ${
          match.status === "completed" ? "border-green-300 dark:border-green-700" : ""
        }`}>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-1">
            <div className={`text-sm flex items-center gap-1 ${isWinner1 ? "font-bold text-green-600 dark:text-green-400" : ""}`}>
              {isWinner1 && <Trophy className="h-3 w-3" />}
              {t1?.name ?? "TBD"}
            </div>
            <div className={`text-sm flex items-center gap-1 ${isWinner2 ? "font-bold text-green-600 dark:text-green-400" : ""}`}>
              {isWinner2 && <Trophy className="h-3 w-3" />}
              {t2?.name ?? "TBD"}
            </div>
            {setStr && <div className="text-xs text-muted-foreground">{setStr}</div>}
            {match.status !== "pending" && (
              <Button size="sm" variant="ghost" className="text-xs h-6 px-2" render={<a href={`/m/${match.shareCode}`} />}>
                {t.dashboard.viewScore}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
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
          <Trophy className="h-6 w-6 text-yellow-500" /> {tournament.title} — {t.cup.title}
        </motion.h1>
        <motion.div variants={itemVariants}>
          <Button variant="outline" render={<a href={`/t/${tournament.id}`}>{t.standings.back}</a>} />
        </motion.div>
      </motion.div>

      {cupMatches.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t.cup.notStarted}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Semi-Finals */}
          <div className="space-y-8">
            <BracketMatch match={semi1} label={t.cup.semi1} />
            <BracketMatch match={semi2} label={t.cup.semi2} />
          </div>

          {/* Connector */}
          <div className="hidden md:flex flex-col items-center gap-4 text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
            <ArrowLeft className="h-5 w-5" />
          </div>

          {/* Final & 3rd Place */}
          <div className="space-y-8">
            <BracketMatch match={finalM} label={t.cup.final} />
            <BracketMatch match={thirdPlace} label={t.cup.thirdPlace} />
          </div>
        </motion.div>
      )}

      <motion.div className="text-center" variants={itemVariants}>
        <Button variant="outline" render={<a href={`/t/${tournament.id}/standings`}>{t.standings.leagueTable}</a>} />
      </motion.div>
    </div>
  )
}
