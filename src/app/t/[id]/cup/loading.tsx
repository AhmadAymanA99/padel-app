import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-8">
        <div className="space-y-8">
          <Card className="min-w-[200px]">
            <CardHeader className="p-3 pb-1"><CardTitle className="text-xs"><Skeleton className="h-3 w-20" /></CardTitle></CardHeader>
            <CardContent className="p-3 pt-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
          <Card className="min-w-[200px]">
            <CardHeader className="p-3 pb-1"><CardTitle className="text-xs"><Skeleton className="h-3 w-20" /></CardTitle></CardHeader>
            <CardContent className="p-3 pt-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
          <Card className="min-w-[200px]">
            <CardHeader className="p-3 pb-1"><CardTitle className="text-xs"><Skeleton className="h-3 w-12" /></CardTitle></CardHeader>
            <CardContent className="p-3 pt-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
