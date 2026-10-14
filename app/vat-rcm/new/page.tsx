"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { VatRcmForm } from "@/components/vat-rcm-form"

export default function NewVatRcmPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">New VAT RCM Declaration</h1>
          <p className="text-sm text-[#9ca3af] mt-1">UAE VAT RCM on Electronic Devices — Article 2, Cabinet Decision No. 91 of 2023</p>
        </div>
        <VatRcmForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
