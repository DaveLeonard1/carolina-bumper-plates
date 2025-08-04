import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

export default function SystemHealthLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Loading Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading system health monitor...</span>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
