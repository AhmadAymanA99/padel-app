"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, ArrowLeft, Clock } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"

type MatchData = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions").getMatchByShareCode>>>

interface Props {
  match: MatchData
}

export function MatchHistory({ match }: Props) {
  const { t, dir } = useLocale()
  const t1Name = match.team1?.name ?? "Team 1"
  const t2Name = match.team2?.name ?? "Team 2"

  const setStr = match.sets?.length > 0
    ? match.sets.map((s) => `${s.team1Score ?? "?"}-${s.team2Score ?? "?"}`).join(", ")
    : t.match.noScoresYet

  return (
    <motion.div
      className="max-w-lg mx-auto space-y-6"
      dir={dir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> {t.match.history}
        </h1>
        <Button variant="outline" size="sm" render={<a href={`/m/${match.shareCode}`} />}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t.match.saveScore}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t1Name} {t.match.vs} {t2Name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> {t.match.currentScores}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-center">
              {match.sets
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((set) => (
                  <div key={set.id} className="contents">
                    <div className={`text-sm font-mono ${
                      set.team1Score && set.team2Score && set.team1Score > set.team2Score
                        ? "text-green-600 dark:text-green-400 font-bold"
                        : ""
                    }`}>
                      {set.team1Score ?? "?"}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.match.set} {set.setNumber}</div>
                    <div className={`text-sm font-mono ${
                      set.team1Score && set.team2Score && set.team2Score > set.team1Score
                        ? "text-green-600 dark:text-green-400 font-bold"
                        : ""
                    }`}>
                      {set.team2Score ?? "?"}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            Status: <Badge variant={match.status === "completed" ? "outline" : "default"}>{match.status}</Badge>
          </div>

          {match.edits && match.edits.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t.match.editHistory}</div>
              {match.edits.map((edit) => {
                let oldScores = "?"
                let newScores = "?"
                try {
                  const old = JSON.parse(edit.oldData)
                  const neu = JSON.parse(edit.newData)
                  oldScores = Array.isArray(old)
                    ? old.map((s: any) => `${s.team1Score ?? "?"}-${s.team2Score ?? "?"}`).join(", ")
                    : edit.oldData
                  newScores = Array.isArray(neu)
                    ? neu.map((s: any) => `${s.team1Score ?? "?"}-${s.team2Score ?? "?"}`).join(", ")
                    : edit.newData
                } catch { /* ignore */ }
                return (
                  <motion.div
                    key={edit.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded p-2 text-xs space-y-1"
                  >
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(edit.createdAt).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">{t.match.old}</span>
                      <span className="line-through">{oldScores}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">{t.match.new}</span>
                      <span className="text-green-600 dark:text-green-400">{newScores}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {(!match.edits || match.edits.length === 0) && (
            <p className="text-sm text-muted-foreground">{t.match.noEdits}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
