"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Plus, Minus, Save, Users } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"
import { updateMatchScore, editMatchScore, updateFFAMatchScore } from "@/lib/actions"

type MatchData = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions").getMatchByShareCode>>>

interface Props {
  match: MatchData
}

export function MatchScoreView({ match }: Props) {
  const router = useRouter()
  const { t, dir } = useLocale()
  const isFFA = match.tournament.mode === "free_for_all"

  const t1Name = match.team1?.name ?? `Player ${match.ffaPlayer1Id?.slice(0, 6) ?? "?"}`
  const t2Name = match.team2?.name ?? `Player ${match.ffaPlayer3Id?.slice(0, 6) ?? "?"}`

  const existingSets = match.sets ?? []
  const initialSets = existingSets.length > 0
    ? existingSets.map((s) => ({
        setNumber: s.setNumber,
        team1Score: s.team1Score ?? null,
        team2Score: s.team2Score ?? null,
      }))
    : [{ setNumber: 1, team1Score: null, team2Score: null }]

  const [sets, setSets] = useState(initialSets)
  const [loading, setLoading] = useState(false)
  const [creatorCode, setCreatorCode] = useState<string | null>(null)
  const isCreator = creatorCode !== null

  useEffect(() => {
    const code = sessionStorage.getItem(`creator_${match.tournament.id}`)
    if (code === match.tournament.creatorCode || code === match.creatorCode) {
      setCreatorCode(code)
    }
  }, [match.tournament.id, match.creatorCode, match.tournament.creatorCode])

  function addSet() {
    setSets([...sets, { setNumber: sets.length + 1, team1Score: null, team2Score: null }])
  }

  function removeSet(index: number) {
    if (sets.length <= 1) return
    const updated = sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 }))
    setSets(updated)
  }

  function updateScore(index: number, side: "team1" | "team2", value: string) {
    const num = value === "" ? null : parseInt(value)
    const updated = sets.map((s, i) =>
      i === index ? { ...s, [side === "team1" ? "team1Score" : "team2Score"]: num } : s
    )
    setSets(updated)
  }

  async function handleSave() {
    setLoading(true)
    try {
      if (isFFA) {
        const t1 = sets[0]?.team1Score ?? 0
        const t2 = sets[0]?.team2Score ?? 0
        await updateFFAMatchScore(match.id, t1, t2)
      } else {
        await updateMatchScore(
          match.id,
          sets.map((s) => ({
            setNumber: s.setNumber,
            team1Score: s.team1Score,
            team2Score: s.team2Score,
          }))
        )
      }
      toast.success("Score saved!")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error saving score")
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    if (!creatorCode) return
    setLoading(true)
    try {
      await editMatchScore(
        match.id,
        existingSets.map((s) => ({ setNumber: s.setNumber, team1Score: s.team1Score, team2Score: s.team2Score })),
        sets.map((s) => ({ setNumber: s.setNumber, team1Score: s.team1Score, team2Score: s.team2Score }))
      )
      toast.success("Score updated!")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error updating score")
    } finally {
      setLoading(false)
    }
  }

  const allFilled = sets.every((s) => s.team1Score !== null && s.team2Score !== null)
  const isCompleted = match.status === "completed"
  const showEdit = creatorCode && isCompleted

  return (
    <motion.div
      className="max-w-lg mx-auto space-y-6"
      dir={dir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">{match.tournament.title}</h1>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">{match.phase.replace("_", " ")} · Round {match.round}</Badge>
          <Badge variant={match.status === "completed" ? "outline" : "default"}>
            {match.status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            <span className="font-bold text-primary">{t1Name}</span>
            <span className="text-muted-foreground mx-3">{t.match.vs}</span>
            <span className="font-bold text-primary">{t2Name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFFA ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t1Name} Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={sets[0]?.team1Score ?? ""}
                    onChange={(e) => updateScore(0, "team1", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t2Name} Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={sets[0]?.team2Score ?? ""}
                    onChange={(e) => updateScore(0, "team2", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-sm font-medium text-center text-muted-foreground">
                <div>{t1Name}</div>
                <div className="w-8"></div>
                <div>{t2Name}</div>
              </div>
              {sets.map((set, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center"
                >
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={set.team1Score ?? ""}
                    onChange={(e) => updateScore(i, "team1", e.target.value)}
                    className="text-center"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-center">
                    {t.match.set} {i + 1}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={set.team2Score ?? ""}
                    onChange={(e) => updateScore(i, "team2", e.target.value)}
                    className="text-center"
                  />
                </motion.div>
              ))}
              {!isCompleted && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addSet} className="flex-1">
                    <Plus className="h-4 w-4 mr-1" /> {t.match.addSet}
                  </Button>
                  {sets.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeSet(sets.length - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {showEdit ? (
              <Button onClick={handleEdit} disabled={loading || !allFilled} className="flex-1">
                <Save className="h-4 w-4 mr-1" /> {loading ? t.match.saving : t.match.editScore}
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading || (!isFFA && !allFilled)} className="flex-1">
                <Save className="h-4 w-4 mr-1" /> {loading ? t.match.saving : isCompleted ? t.match.updateScore : t.match.saveScore}
              </Button>
            )}
            <Button variant="outline" render={<a href={`/m/${match.shareCode}/history`} />}>
              <History className="h-4 w-4 mr-1" /> {t.match.history}
            </Button>
          </div>

          {isCreator && (
            <p className="text-xs text-center text-muted-foreground">
              {t.match.creatorAccess}
            </p>
          )}
        </CardContent>
      </Card>

      {match.team1 && match.team2 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Teams
          </CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><strong>{match.team1.name}:</strong> {match.team1.members.map((m) => m.player.name).join(" + ")}</div>
            <div><strong>{match.team2.name}:</strong> {match.team2.members.map((m) => m.player.name).join(" + ")}</div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
