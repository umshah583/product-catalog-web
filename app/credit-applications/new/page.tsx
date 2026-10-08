"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CreditApplicationForm } from "@/components/credit-application-form"

export default function NewCreditApplicationPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">New Credit Application</h1>
          <p className="text-sm text-[#9ca3af] mt-1">AAF Customer Credit Application Form</p>
        </div>
        <CreditApplicationForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
