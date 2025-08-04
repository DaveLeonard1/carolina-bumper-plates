import { Clock } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 animate-spin" />
        <span>Checking webhook status...</span>
      </div>
    </div>
  )
}
