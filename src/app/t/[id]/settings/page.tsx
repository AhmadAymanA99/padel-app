import { getTournament } from "@/lib/actions"
import { notFound } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await getTournament(id)
  if (!tournament) notFound()

  return <SettingsForm tournament={JSON.parse(JSON.stringify(tournament))} />
}
