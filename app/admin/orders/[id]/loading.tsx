import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

export default function AdminOrderDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div>
          <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: colorUsage.backgroundLight }}></div>
          <div
            className="h-4 w-32 rounded animate-pulse mt-2"
            style={{ backgroundColor: colorUsage.backgroundLight }}
          ></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <div
                className="h-6 w-48 rounded animate-pulse"
                style={{ backgroundColor: colorUsage.backgroundLight }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="h-4 w-full rounded animate-pulse"
                  style={{ backgroundColor: colorUsage.backgroundLight }}
                ></div>
                <div
                  className="h-4 w-3/4 rounded animate-pulse"
                  style={{ backgroundColor: colorUsage.backgroundLight }}
                ></div>
                <div
                  className="h-4 w-1/2 rounded animate-pulse"
                  style={{ backgroundColor: colorUsage.backgroundLight }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Card */}
          <Card>
            <CardHeader>
              <div
                className="h-6 w-32 rounded animate-pulse"
                style={{ backgroundColor: colorUsage.backgroundLight }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 w-full rounded animate-pulse"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <div
                className="h-6 w-40 rounded animate-pulse"
                style={{ backgroundColor: colorUsage.backgroundLight }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 w-full rounded animate-pulse"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div
                className="h-6 w-32 rounded animate-pulse"
                style={{ backgroundColor: colorUsage.backgroundLight }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-full rounded animate-pulse"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <div
                className="h-6 w-32 rounded animate-pulse"
                style={{ backgroundColor: colorUsage.backgroundLight }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-full rounded animate-pulse"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
