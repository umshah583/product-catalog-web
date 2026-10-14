"use client"

import { useEffect, useRef, useState } from "react"

/** Canvas signature pad — draw with pointer or upload an image. */
export function SignaturePad({
  value,
  onChange,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(!!value)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#1a1a2e"
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height)
      img.src = value
    }
  }, [value])

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={480}
        height={140}
        className="w-full max-w-md bg-white rounded-lg border border-[rgba(255,255,255,0.15)] cursor-crosshair touch-none"
        onPointerDown={(e) => {
          drawing.current = true
          const ctx = canvasRef.current!.getContext("2d")!
          const p = pos(e)
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          const ctx = canvasRef.current!.getContext("2d")!
          ctx.lineTo(pos(e).x, pos(e).y)
          ctx.stroke()
          setHasInk(true)
        }}
        onPointerUp={() => {
          drawing.current = false
          onChange(canvasRef.current!.toDataURL("image/png"))
        }}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            const c = canvasRef.current!
            c.getContext("2d")!.fillStyle = "#ffffff"
            c.getContext("2d")!.fillRect(0, 0, c.width, c.height)
            setHasInk(false)
            onChange(null)
          }}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6]"
        >
          Clear
        </button>
        <label className="text-xs px-3 py-1.5 rounded-lg bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6] cursor-pointer">
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => {
                onChange(reader.result as string)
                setHasInk(true)
              }
              reader.readAsDataURL(f)
            }}
          />
        </label>
      </div>
    </div>
  )
}
