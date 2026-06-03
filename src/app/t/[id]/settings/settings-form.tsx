"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, ArrowLeft, Save } from "lucide-react"
import { useLocale } from "@/lib/i18n/context"
import { updateTournamentSettings } from "@/lib/actions"

type TournamentData = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions").getTournament>>>

interface Props {
  tournament: TournamentData
}

export function SettingsForm({ tournament }: Props) {
  const router = useRouter()
  const { t, dir } = useLocale()
  const [creatorCode, setCreatorCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const code = sessionStorage.getItem(`creator_${tournament.id}`)
    setCreatorCode(code)
  }, [tournament.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!creatorCode) {
      toast.error(t.settings.noAccess)
      return
    }
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      form.set("creatorCode", creatorCode)
      await updateTournamentSettings(form)
      toast.success("Settings saved!")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const isLocked = tournament.status !== "setup"

  return (
    <motion.div
      className="max-w-lg mx-auto space-y-6"
      dir={dir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> {t.settings.title}
        </h1>
        <Button variant="outline" render={<a href={`/t/${tournament.id}`}>{t.settings.back}</a>} />
      </div>

      {!creatorCode && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t.settings.noAccess}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> {t.settings.editSettings}
          </CardTitle>
          <CardDescription>
            {isLocked ? t.settings.locked : t.settings.changesImmediate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="tournamentId" value={tournament.id} />

            <div className="space-y-2">
              <Label htmlFor="title">{t.home.tournamentName}</Label>
              <Input
                id="title"
                name="title"
                defaultValue={tournament.title}
                disabled={isLocked || !creatorCode}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deuceRule">{t.home.deuceRule}</Label>
              <select
                id="deuceRule"
                name="deuceRule"
                defaultValue={tournament.deuceRule}
                disabled={isLocked || !creatorCode}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="classic_advantage">{t.home.classicAdvantage}</option>
                <option value="golden_point">{t.home.goldenPoint}</option>
                <option value="star_point">{t.home.starPoint}</option>
              </select>
            </div>

            {tournament.mode === "league_cup" && (
              <div className="space-y-2">
                <Label htmlFor="legCount">{t.home.legs}</Label>
                <select
                  id="legCount"
                  name="legCount"
                  defaultValue={tournament.legCount.toString()}
                  disabled={isLocked || !creatorCode}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="1">{t.home.leg1}</option>
                  <option value="2">{t.home.leg2}</option>
                </select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || isLocked || !creatorCode}>
              <Save className="h-4 w-4 mr-1" /> {loading ? t.settings.saving : t.settings.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
