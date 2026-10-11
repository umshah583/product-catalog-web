"use client"

import { Plus, X, Check } from "lucide-react"
import { useState } from "react"
import type { ProductColor } from "@/lib/api"

interface ColorPaletteEditorProps {
  colors: ProductColor[]
  onChange: (colors: ProductColor[]) => void
  /** Product image URLs — when provided, each color can be linked to one */
  images?: string[]
}

// Common catalog colors — click to add
const PALETTE: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Grey", hex: "#808080" },
  { name: "Gold", hex: "#d4af37" },
  { name: "Rose Gold", hex: "#b76e79" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#22c55e" },
  { name: "Mint", hex: "#6ee7b7" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Brown", hex: "#92400e" },
  { name: "Beige", hex: "#e5d5b8" },
  { name: "Maroon", hex: "#7f1d1d" },
]

/**
 * Visual palette picker for product color variants. Each color carries
 * a display name, a swatch hex, and an in-stock flag — colors marked
 * out of stock stay visible in the app but can't be selected.
 */
export function ColorPaletteEditor({ colors, onChange, images = [] }: ColorPaletteEditorProps) {
  const [customName, setCustomName] = useState("")
  const [customHex, setCustomHex] = useState("#8b5cf6")

  const addColor = (name: string, hex: string) => {
    const n = name.trim()
    if (!n || colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) return
    onChange([...colors, { name: n, hex, inStock: true }])
  }

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index))
  }

  const toggleStock = (index: number) => {
    onChange(colors.map((c, i) => (i === index ? { ...c, inStock: !c.inStock } : c)))
  }

  const setImage = (index: number, image?: string) => {
    onChange(colors.map((c, i) => (i === index ? { ...c, image } : c)))
  }

  return (
    <div className="space-y-3">
      {/* Selected colors */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <div
              key={i}
              className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                c.inStock
                  ? "border-[rgba(255,255,255,0.12)] bg-[#21222d]"
                  : "border-[rgba(239,68,68,0.4)] bg-[#ef4444]/10"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: c.hex }}
              />
              <span className={`text-xs font-medium ${c.inStock ? "text-[#f3f4f6]" : "text-[#9ca3af] line-through"}`}>
                {c.name}
              </span>
              <button
                type="button"
                onClick={() => toggleStock(i)}
                title={c.inStock ? "Mark out of stock" : "Mark in stock"}
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                  c.inStock
                    ? "bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#ef4444]/20 hover:text-[#ef4444]"
                    : "bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#22c55e]/20 hover:text-[#22c55e]"
                }`}
              >
                {c.inStock ? "IN" : "OUT"}
              </button>
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-[#9ca3af] hover:text-[#ef4444] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link each color to a product image */}
      {colors.length > 0 && images.length > 0 && (
        <div className="space-y-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1b26] p-3">
          <p className="text-xs text-[#9ca3af]">Link an image to each color (tap a thumbnail):</p>
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 overflow-x-auto">
              <span className="inline-flex items-center gap-1.5 shrink-0 text-xs text-[#f3f4f6] w-24">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="truncate">{c.name}</span>
              </span>
              {images.map((img, imgIdx) => {
                const linked = c.image === img
                return (
                  <button
                    key={imgIdx}
                    type="button"
                    onClick={() => setImage(i, linked ? undefined : img)}
                    className={`h-10 w-10 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      linked
                        ? "border-[#8b5cf6] ring-1 ring-[#8b5cf6]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Palette */}
      <div>
        <p className="text-xs text-[#9ca3af] mb-2">Tap a swatch to add:</p>
        <div className="grid grid-cols-10 gap-2">
          {PALETTE.map((p) => {
            const added = colors.some((c) => c.name === p.name)
            return (
              <button
                key={p.name}
                type="button"
                title={p.name}
                onClick={() => addColor(p.name, p.hex)}
                className="relative h-8 w-8 rounded-full border border-white/15 transition-transform hover:scale-110"
                style={{ backgroundColor: p.hex }}
              >
                {added && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom color */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          className="h-9 w-12 rounded-lg bg-[#21222d] border border-[rgba(255,255,255,0.08)] p-1 cursor-pointer"
        />
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addColor(customName, customHex)
              setCustomName("")
            }
          }}
          placeholder="Custom color name"
          className="flex-1 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
        />
        <button
          type="button"
          onClick={() => {
            addColor(customName, customHex)
            setCustomName("")
          }}
          className="p-2 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
