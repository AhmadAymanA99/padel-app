import { getTournament } from "@/lib/actions"
import { notFound } from "next/navigation"
import { TournamentDashboard } from "./dashboard"

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await getTournament(id)
  if (!tournament) notFound()

  return <TournamentDashboard tournament={JSON.parse(JSON.stringify(tournament))} />
}
