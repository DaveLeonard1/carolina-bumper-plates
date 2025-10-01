# Business Settings Usage Guide

The business settings system allows you to manage site-wide configuration from `/admin/settings`.

## Settings Available

- **Business Name** - Company name displayed across the site
- **Business Email** - Contact email
- **Business Phone** - Contact phone number  
- **Business Address** - Physical address
- **Website** - Company website URL
- **Minimum Order Weight** - Minimum weight required for orders (in lbs)
- **Tax Rate** - Sales tax rate (decimal format, e.g., 0.0725 for 7.25%)

## How to Use Settings in Your Components

### In Client Components

```tsx
"use client"

import { useBusinessSettings } from "@/lib/contexts/business-settings-context"

export function MyComponent() {
  const { settings, loading } = useBusinessSettings()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>{settings.business_name}</h1>
      <p>Email: {settings.business_email}</p>
      <p>Phone: {settings.business_phone}</p>
      <p>Tax Rate: {(settings.tax_rate * 100).toFixed(2)}%</p>
    </div>
  )
}
```

### In API Routes

```ts
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  // Fetch business settings
  const { data } = await supabase
    .from("options")
    .select("option_name, option_value")
    .eq("option_name", "business_email")
    .single()

  const businessEmail = data?.option_value || "default@example.com"

  // Use the setting
  // ...
}
```

## How Settings Are Stored

Settings are stored in the `options` table with the following schema:

```sql
options (
  option_name VARCHAR PRIMARY KEY,
  option_value TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Admin Management

1. Navigate to `/admin/settings`
2. Update any business information or order settings
3. Click "Save Changes"
4. Settings are immediately available across the entire site

## Example: Using in Footer

```tsx
"use client"

import { useBusinessSettings } from "@/lib/contexts/business-settings-context"

export function Footer() {
  const { settings } = useBusinessSettings()

  return (
    <footer>
      <p>© 2024 {settings.business_name}</p>
      <p>Email: {settings.business_email}</p>
      <p>Phone: {settings.business_phone}</p>
      <p>{settings.business_address}</p>
    </footer>
  )
}
```

## Example: Using Tax Rate in Checkout

```tsx
"use client"

import { useBusinessSettings } from "@/lib/contexts/business-settings-context"

export function CheckoutSummary() {
  const { settings } = useBusinessSettings()
  const subtotal = 100.00

  const tax = subtotal * settings.tax_rate
  const total = subtotal + tax

  return (
    <div>
      <p>Subtotal: ${subtotal.toFixed(2)}</p>
      <p>Tax ({(settings.tax_rate * 100).toFixed(2)}%): ${tax.toFixed(2)}</p>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  )
}
```

## Notes

- Settings are cached in React context after first load
- Use `refetch()` from the hook if you need to manually refresh settings
- All settings have sensible defaults if not set in the database
- The provider is automatically available throughout the app (added to root layout)
