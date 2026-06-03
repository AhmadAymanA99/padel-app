import { getMatchByShareCode } from "@/lib/actions"
import { notFound } from "next/navigation"
import { MatchHistory } from "./match-history"

export default async function HistoryPage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode } = await params
  const match = await getMatchByShareCode(shareCode)
  if (!match) notFound()

  return <MatchHistory match={JSON.parse(JSON.stringify(match))} />
}
