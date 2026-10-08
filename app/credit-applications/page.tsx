"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { FileSignature, Loader2, Search, Plus, Eye, Printer, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type CreditApplication } from "@/lib/api"
import { useRealtimeSync } from "@/lib/use-realtime-sync"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#9ca3af]/20 text-[#9ca3af]",
  SUBMITTED: "bg-[#3b82f6]/20 text-[#3b82f6]",
  UNDER_REVIEW: "bg-[#f59e0b]/20 text-[#f59e0b]",
  APPROVED: "bg-[#10b981]/20 text-[#10b981]",
  REJECTED: "bg-[#ef4444]/20 text-[#ef4444]",
}

const STATUS_FILTERS = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]

export default function CreditApplicationsPage() {
  const [apps, setApps] = useState<CreditApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.getCreditApplications(statusFilter === "ALL" ? undefined : statusFilter)
      setApps(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchApps()
  }, [fetchApps])

  useRealtimeSync({ onOrdersChanged: () => fetchApps() })

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft application?")) return
    try {
      await api.deleteCreditApplication(id)
      setApps((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  const filtered = apps.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.appNumber.toLowerCase().includes(q) || a.customerName.toLowerCase().includes(q)
  })

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">Credit Applications</h1>
              <p className="text-sm text-[#9ca3af] mt-1">{apps.length} application{apps.length === 1 ? "" : "s"}</p>
            </div>
            <Link href="/credit-applications/new"
              className="inline-flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors self-start sm:self-auto">
              <Plus className="h-4 w-4" /> New Credit Application
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by app # or customer..."
                className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? "bg-[#8b5cf6] text-white" : "bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" /></div>
          ) : error ? (
            <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]"><p className="text-[#ef4444]">Error: {error}</p></div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#171821] rounded-xl p-12 border border-[rgba(255,255,255,0.08)] text-center">
              <FileSignature className="h-12 w-12 text-[#9ca3af] mx-auto mb-4" />
              <p className="text-[#f3f4f6] font-medium">No credit applications yet</p>
              <p className="text-sm text-[#9ca3af] mt-1">Create a credit application for a customer.</p>
            </div>
          ) : (
            <div className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    {["Application #", "Date", "Customer", "TRN", "Credit Limit", "Status", "Actions"].map((h) => (
                      <th key={h} className={`text-${h === "Actions" ? "right" : "left"} px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[#21222d]/50">
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">{a.appNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-[#f3f4f6]">{a.customerName}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">{a.customerTrn || "—"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">
                        {a.formData?.creditAmount ? `AED ${a.formData.creditAmount}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <Link href={`/credit-applications/${a.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21222d] text-[#f3f4f6] text-xs hover:bg-[#8b5cf6]">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          {a.status === "DRAFT" && (
                            <button onClick={() => handleDelete(a.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21222d] text-[#ef4444] text-xs hover:bg-[#ef4444]/20">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
