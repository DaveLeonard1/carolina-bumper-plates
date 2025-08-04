import { RefreshCw } from "lucide-react"

export default function InvestigateWebhookTriggerLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Investigating webhook trigger...</p>
      </div>
    </div>
  )
}
