# Batch Progress Component Usage

## Overview

The `BatchProgress` component displays real-time progress toward your minimum order weight goal for batch fulfillment.

## Features

✅ **Dynamic Data** - Pulls current weight from pending orders
✅ **Goal from Database** - Gets minimum_order_weight from options table
✅ **Auto-refresh** - Updates every 60 seconds
✅ **Visual Progress Bar** - Shows percentage with lime green styling
✅ **Order Count** - Displays number of pending orders
✅ **Goal Status** - Different messages for before/after goal is met

---

## API Endpoint

**`GET /api/batch-progress`**

Returns:
```json
{
  "success": true,
  "data": {
    "currentWeight": 8320,
    "goalWeight": 7000,
    "percentage": 118.9,
    "remaining": 0,
    "orderCount": 15,
    "isGoalMet": true
  }
}
```

**Logic:**
- Fetches `minimum_order_weight` from options table
- Sums `total_weight` from all orders with:
  - `status` in ["pending", "quote_sent", "payment_link_sent"]
  - `payment_status` = "unpaid"

---

## Component Usage

### 1. Import the Component

```tsx
import { BatchProgress } from "@/components/batch-progress"
```

### 2. Use in Your Page

```tsx
export default function HomePage() {
  return (
    <div>
      {/* Your other content */}
      
      <BatchProgress />
      
      {/* More content */}
    </div>
  )
}
```

### 3. Replace Existing Static HTML

**Before (Static):**
```html
<section style="background-color: rgb(26, 26, 26);">
  <div class="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
    <div class="max-w-[1440px] mx-auto text-center">
      <h2 class="text-4xl lg:text-5xl font-black mb-12 text-white">BATCH PROGRESS</h2>
      <div class="bg-gray-800 rounded-2xl p-8">
        <div class="flex justify-between items-center mb-6 text-white">
          <div class="text-3xl font-bold">8,320 lbs</div>
          <div class="text-3xl font-bold">10,000 lbs</div>
        </div>
        <!-- Static progress bar -->
      </div>
    </div>
  </div>
</section>
```

**After (Dynamic):**
```tsx
<BatchProgress />
```

---

## Customization

### Change Refresh Interval

Edit `/components/batch-progress.tsx`:

```tsx
// Refresh every 30 seconds instead of 60
const interval = setInterval(fetchBatchProgress, 30000)
```

### Change Colors

The component uses:
- **Background:** `#1a1a1a` (black)
- **Progress Bar:** `#B9FF16` (lime green)
- **Card Background:** `bg-gray-800`

Edit the component to customize.

### Add Custom Styling

Pass custom classes or wrap in a container:

```tsx
<div className="my-custom-wrapper">
  <BatchProgress />
</div>
```

---

## What Counts as "Pending"?

Orders are included in the batch if:
- ✅ Status is `pending`, `quote_sent`, or `payment_link_sent`
- ✅ Payment status is `unpaid`

**Not included:**
- ❌ Paid orders (they've moved to fulfillment)
- ❌ Cancelled orders
- ❌ Delivered orders

---

## Admin Control

Update the goal weight at **`/admin/settings`**:
- Edit "Minimum Order Weight (lbs)"
- Save changes
- Progress bar automatically updates on next refresh

---

## Testing

1. **Create test orders** with different weights
2. **Check the API** directly: `http://localhost:3000/api/batch-progress`
3. **Verify calculation:**
   - If goal is 7000 lbs
   - Current pending orders = 5000 lbs
   - Progress = 71.4%
   - Remaining = 2000 lbs

---

## Example Scenarios

### Scenario 1: Below Goal
```
Current: 5,320 lbs (12 orders)
Goal: 7,000 lbs
Progress: 76%
Message: "Only 1,680 lbs to go before the next batch is fulfilled!"
```

### Scenario 2: Goal Met
```
Current: 8,320 lbs (15 orders)
Goal: 7,000 lbs
Progress: 100% (capped at 100% visually)
Message: "Goal reached! 15 orders ready for batch fulfillment!"
```

### Scenario 3: No Pending Orders
```
Current: 0 lbs (0 orders)
Goal: 7,000 lbs
Progress: 0%
Message: "Only 7,000 lbs to go before the next batch is fulfilled!"
```
