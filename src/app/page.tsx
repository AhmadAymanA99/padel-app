"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Trophy, Users, ShuffleIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/lib/i18n/context"
import { createTournament } from "@/lib/actions"

export default function Home() {
  const router = useRouter()
  const { t, dir } = useLocale()
  const [mode, setMode] = useState<string>("league_cup")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""])

  function addPlayer() {
    setPlayerNames([...playerNames, ""])
  }

  function removePlayer(index: number) {
    if (playerNames.length <= 2) return
    setPlayerNames(playerNames.filter((_, i) => i !== index))
  }

  function updatePlayer(index: number, value: string) {
    const updated = [...playerNames]
    updated[index] = value
    setPlayerNames(updated)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const valid = playerNames.filter((n) => n.trim())
    if (valid.length < 2) {
      toast.error(t.home.minPlayers)
      return
    }
    setLoading(true)
    setError("")

    try {
      const form = new FormData(e.currentTarget)
      form.set("playerNames", valid.join("\n"))
      const result = await createTournament(form)
      sessionStorage.setItem(`creator_${result.id}`, result.creatorCode)
      router.push(`/t/${result.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    { value: "league_cup", label: t.home.leagueCup, desc: t.home.leagueCupDesc, icon: Trophy },
    { value: "cup", label: t.home.cup, desc: t.home.cupDesc, icon: ShuffleIcon },
    { value: "free_for_all", label: t.home.ffa, desc: t.home.ffaDesc, icon: Users },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8" dir={dir}>
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-muted-foreground">{t.app.tagline}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t.home.tournamentName}</Label>
                <Input id="title" name="title" placeholder={t.home.tournamentPlaceholder} />
              </div>

              <div className="space-y-2">
                <Label>{t.home.mode}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {modes.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMode(opt.value)}
                        className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                          mode === opt.value
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 ${mode === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>
                <input type="hidden" name="mode" value={mode} />
              </div>

              {mode === "league_cup" && (
                <div className="space-y-2">
                  <Label htmlFor="legCount">{t.home.legs}</Label>
                  <select
                    id="legCount"
                    name="legCount"
                    defaultValue="1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="1">{t.home.leg1}</option>
                    <option value="2">{t.home.leg2}</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courtCount">{t.home.courts}</Label>
                  <Input id="courtCount" name="courtCount" type="number" min="1" max="10" defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deuceRule">{t.home.deuceRule}</Label>
                  <select
                    id="deuceRule"
                    name="deuceRule"
                    defaultValue="classic_advantage"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="classic_advantage">{t.home.classicAdvantage}</option>
                    <option value="golden_point">{t.home.goldenPoint}</option>
                    <option value="star_point">{t.home.starPoint}</option>
                  </select>
                </div>
              </div>

              {mode === "free_for_all" && (
                <div className="space-y-2">
                  <Label htmlFor="targetScore">{t.home.targetScore}</Label>
                  <Input id="targetScore" name="targetScore" type="number" min="8" max="50" defaultValue="24" />
                </div>
              )}

              <div className="space-y-3">
                <Label>{t.home.players}</Label>
                <AnimatePresence>
                  {playerNames.map((name, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={name}
                        onChange={(e) => updatePlayer(i, e.target.value)}
                        placeholder={`${t.home.playerPlaceholder} ${i + 1}`}
                        className="flex-1"
                      />
                      {playerNames.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePlayer(i)} className="shrink-0 text-destructive hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button type="button" variant="outline" size="sm" onClick={addPlayer} className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> {t.home.addPlayer}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {mode === "league_cup" || mode === "cup"
                    ? t.home.playersHint_league
                    : t.home.playersHint_ffa}
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.home.creating : t.home.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
