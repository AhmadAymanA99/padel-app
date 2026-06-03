import { getMatchByShareCode } from "@/lib/actions"
import { notFound } from "next/navigation"
import { MatchScoreView } from "./match-score"

export default async function MatchPage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode } = await params
  const match = await getMatchByShareCode(shareCode)
  if (!match) notFound()

  return <MatchScoreView match={JSON.parse(JSON.stringify(match))} />
}
