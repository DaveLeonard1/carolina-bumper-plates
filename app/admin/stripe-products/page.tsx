/*  This server component is now just a light wrapper that renders the
    client-side UI above.  Keeping the file tiny prevents a huge client
    bundle from being inlined, which is what broke the preview earlier. */

import dynamic from "next/dynamic"

const StripeProductsClient = dynamic(() => import("@/components/admin/stripe-products-client"), { ssr: false })

export default function StripeProductsPage() {
  return <StripeProductsClient />
}
