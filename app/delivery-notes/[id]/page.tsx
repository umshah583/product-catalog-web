"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { DeliveryNoteForm } from "@/components/delivery-note-form"
import { api, type DeliveryNote } from "@/lib/api"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function EditDeliveryNotePage() {
  const params = useParams()
  const id = params.id as string
  const [note, setNote] = useState<DeliveryNote | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getDeliveryNote(id)
      .then(setNote)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [id])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">
            {note ? `Delivery Note ${note.dnNumber}` : "Delivery Note"}
          </h1>
        </div>
        {error ? (
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]">
            <p className="text-[#ef4444]">Error: {error}</p>
          </div>
        ) : note ? (
          <DeliveryNoteForm existing={note} />
        ) : (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
