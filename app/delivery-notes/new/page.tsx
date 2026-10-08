"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { DeliveryNoteForm } from "@/components/delivery-note-form"

export default function NewDeliveryNotePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">Create Delivery Note</h1>
        </div>
        <DeliveryNoteForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
