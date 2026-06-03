import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            <Skeleton className="h-6 w-64 mx-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <Skeleton className="h-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
