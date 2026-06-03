import { getTournament } from "@/lib/actions"
import { notFound } from "next/navigation"
import { CupBracket } from "./cup-bracket"

export default async function CupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await getTournament(id)
  if (!tournament) notFound()

  return <CupBracket tournament={JSON.parse(JSON.stringify(tournament))} />
}
