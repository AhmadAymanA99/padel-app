import { getTournament } from "@/lib/actions"
import { notFound } from "next/navigation"
import { StandingsView } from "./standings-view"

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await getTournament(id)
  if (!tournament) notFound()

  return <StandingsView tournament={JSON.parse(JSON.stringify(tournament))} />
}
