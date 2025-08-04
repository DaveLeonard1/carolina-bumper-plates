// Comprehensive pricing audit and validation utilities

export interface PriceValidation {
  isValid: boolean
  correctedValue: number
  issues: string[]
  severity: "low" | "medium" | "high"
}

export interface SavingsValidation {
  isValid: boolean
  savingsAmount: number
  savingsPercentage: number
  issues: string[]
}

export interface OrderTotalValidation {
  calculatedTotal: number
  storedTotal: number
  difference: number
  isAccurate: boolean
  items: OrderItemValidation[]
}

export interface OrderItemValidation {
  weight: number
  quantity: number
  unitPrice: number
  lineTotal: number
  isValid: boolean
  issues: string[]
}

/**
 * Validates a price value for accuracy and precision
 */
export function validatePrice(price: number): PriceValidation {
  const issues: string[] = []
  let severity: "low" | "medium" | "high" = "low"

  // Round to 2 decimal places for comparison
  const rounded = Math.round(price * 100) / 100

  // Check for precision issues
  if (price !== rounded) {
    issues.push(`Price has more than 2 decimal places: ${price} should be ${rounded}`)
    severity = "medium"
  }

  // Check for negative prices
  if (price <= 0) {
    issues.push("Price must be greater than zero")
    severity = "high"
  }

  // Check for unreasonably high prices
  if (price > 10000) {
    issues.push("Price seems unusually high (>$10,000)")
    severity = "medium"
  }

  return {
    isValid: issues.length === 0,
    correctedValue: Math.max(0.01, rounded),
    issues,
    severity,
  }
}

/**
 * Validates savings calculation between regular and selling price
 */
export function validateSavings(sellingPrice: number, regularPrice: number): SavingsValidation {
  const issues: string[] = []

  // Calculate savings
  const savingsAmount = Math.round((regularPrice - sellingPrice) * 100) / 100
  const savingsPercentage = regularPrice > 0 ? Math.round((savingsAmount / regularPrice) * 10000) / 100 : 0

  // Validate savings logic
  if (regularPrice <= sellingPrice) {
    issues.push("Regular price must be higher than selling price to show savings")
  }

  if (savingsPercentage > 90) {
    issues.push("Savings percentage seems unusually high (>90%)")
  }

  if (savingsPercentage < 0) {
    issues.push("Negative savings detected - regular price is lower than selling price")
  }

  return {
    isValid: issues.length === 0,
    savingsAmount: Math.max(0, savingsAmount),
    savingsPercentage: Math.max(0, savingsPercentage),
    issues,
  }
}

/**
 * Validates order total calculation from individual items
 */
export function validateOrderTotal(items: any[], storedTotal: number): OrderTotalValidation {
  const itemValidations: OrderItemValidation[] = []
  let calculatedTotal = 0

  // Validate each item
  for (const item of items) {
    const weight = Number(item.weight) || 0
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.price) || 0
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100

    const itemIssues: string[] = []

    if (weight <= 0) itemIssues.push("Invalid weight")
    if (quantity <= 0) itemIssues.push("Invalid quantity")
    if (unitPrice <= 0) itemIssues.push("Invalid unit price")

    itemValidations.push({
      weight,
      quantity,
      unitPrice,
      lineTotal,
      isValid: itemIssues.length === 0,
      issues: itemIssues,
    })

    if (itemIssues.length === 0) {
      calculatedTotal += lineTotal
    }
  }

  // Round final total
  calculatedTotal = Math.round(calculatedTotal * 100) / 100
  const difference = Math.abs(calculatedTotal - storedTotal)

  return {
    calculatedTotal,
    storedTotal,
    difference,
    isAccurate: difference <= 0.01, // Allow for 1 cent rounding differences
    items: itemValidations,
  }
}

/**
 * Formats currency values consistently
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculates total weight for an order (accounting for pairs)
 */
export function calculateTotalWeight(items: any[]): number {
  return items.reduce((total, item) => {
    const weight = Number(item.weight) || 0
    const quantity = Number(item.quantity) || 0
    return total + weight * quantity * 2 // Each plate is sold in pairs
  }, 0)
}

/**
 * Comprehensive product pricing audit
 */
export function auditProductPricing(product: any) {
  const sellingPriceValidation = validatePrice(product.selling_price)
  const regularPriceValidation = validatePrice(product.regular_price)
  const savingsValidation = validateSavings(product.selling_price, product.regular_price)

  const allIssues = [
    ...sellingPriceValidation.issues.map((issue) => `Selling Price: ${issue}`),
    ...regularPriceValidation.issues.map((issue) => `Regular Price: ${issue}`),
    ...savingsValidation.issues,
  ]

  const highestSeverity = [sellingPriceValidation, regularPriceValidation].reduce(
    (max, validation) => {
      const severityOrder = { low: 1, medium: 2, high: 3 }
      return severityOrder[validation.severity] > severityOrder[max] ? validation.severity : max
    },
    "low" as "low" | "medium" | "high",
  )

  return {
    isValid: allIssues.length === 0,
    issues: allIssues,
    severity: highestSeverity,
    corrections: {
      selling_price: sellingPriceValidation.correctedValue,
      regular_price: regularPriceValidation.correctedValue,
      savings_amount: savingsValidation.savingsAmount,
      savings_percentage: savingsValidation.savingsPercentage,
    },
  }
}
