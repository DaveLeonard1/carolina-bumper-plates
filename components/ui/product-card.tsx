"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface ProductCardProps {
  title: string
  price: number
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  disabled?: boolean
  imageUrl?: string
  regularPrice?: number
  metadata?: string // For weight, savings, etc.
  subtotalText?: string
  decreaseDisabled?: boolean
}

export function ProductCard({
  title,
  price,
  quantity,
  onDecrease,
  onIncrease,
  disabled = false,
  imageUrl,
  regularPrice,
  metadata,
  subtotalText,
  decreaseDisabled = false,
}: ProductCardProps) {
  return (
    <div className="md:hidden">
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-4">
        {/* Product name header - spans full width */}
        <div className="bg-black text-white px-4 py-3">
          <h3 className="font-bold text-base uppercase tracking-wide">{title}</h3>
        </div>

        <div className="flex">
          {/* Product image - edge-to-edge on left */}
          <div className="w-24 flex-shrink-0 bg-gray-50">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <span className="text-2xl">🏋️</span>
              </div>
            )}
          </div>

          {/* Content on the right with padding */}
          <div className="flex-1 flex flex-col min-w-0 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div>
                  <span className="text-2xl font-bold">${price}</span>
                  {regularPrice && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      ${regularPrice}
                    </span>
                  )}
                  {metadata && !regularPrice && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {metadata}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white"
                  onClick={onDecrease}
                  disabled={decreaseDisabled || disabled}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="text-lg font-bold w-8 text-center tabular-nums">
                  {quantity}
                </span>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded bg-white hover:bg-[#B9FF16] text-black border border-gray-300 hover:border-[#B9FF16]"
                  onClick={onIncrease}
                  disabled={disabled}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {/* Metadata or subtotal below price and quantity */}
            <div className="text-sm text-gray-400">
              {metadata && (
                <div>{metadata}</div>
              )}
              {subtotalText && (
                <div>{subtotalText}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
