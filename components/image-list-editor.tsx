"use client"

import { Plus, Trash2, Image as ImageIcon, X } from "lucide-react"
import { useState } from "react"

interface ImageListEditorProps {
  images: string[]
  onChange: (images: string[]) => void
  convertImageUrl?: (url: string) => string
}

/**
 * Edit a list of image URLs for a product, with live thumbnail previews.
 * Used in the Add/Edit Product modals.
 */
export function ImageListEditor({ images, onChange, convertImageUrl }: ImageListEditorProps) {
  const [draft, setDraft] = useState("")

  const addImage = () => {
    const url = draft.trim()
    if (!url) return
    onChange([...images, url])
    setDraft("")
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const normalize = (url: string) => (convertImageUrl ? convertImageUrl(url) : url)

  return (
    <div className="space-y-3">
      {/* Existing images with previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square w-full bg-[#21222d] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                {normalize(url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={normalize(url)}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-[#9ca3af]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add new image URL */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addImage()
            }
          }}
          className="flex-1 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
          placeholder="Paste image URL and press Enter"
        />
        <button
          type="button"
          onClick={addImage}
          className="flex items-center gap-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-3 py-2 rounded-lg transition-colors"
          title="Add image"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      <p className="text-xs text-[#9ca3af]">
        {images.length === 0
          ? "No images yet. Customers see a carousel of all images on the product page."
          : `${images.length} image${images.length === 1 ? "" : "s"}. First image is used as the thumbnail.`}
      </p>
    </div>
  )
}
