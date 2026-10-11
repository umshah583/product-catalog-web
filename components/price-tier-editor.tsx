"use client"

import { Plus, X } from "lucide-react"
import type { PriceTier } from "@/lib/api"

interface PriceTierEditorProps {
  tiers: PriceTier[]
  onChange: (tiers: PriceTier[]) => void
  currencySymbol?: string
}

/**
 * Bulk-pricing editor — rows of "min quantity → unit price".
 * Sorted ascending by minQty on save; the mobile app picks the
 * highest tier whose minQty is <= the ordered quantity.
 */
export function PriceTierEditor({ tiers, onChange, currencySymbol = "AED" }: PriceTierEditorProps) {
  const update = (index: number, field: keyof PriceTier, value: string) => {
    const num = parseFloat(value)
    onChange(
      tiers.map((t, i) => (i === index ? { ...t, [field]: isNaN(num) ? 0 : num } : t))
    )
  }

  const remove = (index: number) => onChange(tiers.filter((_, i) => i !== index))

  const add = () => {
    const nextMin = tiers.length > 0 ? Math.max(...tiers.map((t) => t.minQty)) + 10 : 10
    onChange([...tiers, { minQty: nextMin, price: 0 }])
  }

  return (
    <div className="space-y-2">
      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-[#9ca3af] shrink-0">Qty ≥</span>
            <input
              type="number"
              min={2}
              value={tier.minQty}
              onChange={(e) => update(i, "minQty", e.target.value)}
              className="w-20 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-[#9ca3af] shrink-0">{currencySymbol}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={tier.price}
              onChange={(e) => update(i, "price", e.target.value)}
              className="w-28 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[#9ca3af] hover:text-[#ef4444] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add bulk price
      </button>
      <p className="text-xs text-[#9ca3af]">
        Customers see the tier price once their cart quantity reaches the minimum.
      </p>
    </div>
  )
}
