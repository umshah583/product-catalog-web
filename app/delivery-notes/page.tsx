"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Truck,
  Loader2,
  Search,
  Plus,
  Eye,
  Printer,
  Trash2,
  FileText,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type DeliveryNote, type Settings } from "@/lib/api"
import { useRealtimeSync } from "@/lib/use-realtime-sync"
import { printDeliveryNoteDoc, docFromDeliveryNote } from "@/lib/delivery-note"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#9ca3af]/20 text-[#9ca3af]",
  PENDING: "bg-[#f59e0b]/20 text-[#f59e0b]",
  DELIVERED: "bg-[#10b981]/20 text-[#10b981]",
  CANCELLED: "bg-[#ef4444]/20 text-[#ef4444]",
}

const STATUS_FILTERS = ["ALL", "DRAFT", "PENDING", "DELIVERED", "CANCELLED"]

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchNotes = useCallback(async () => {
    try {
      const data = await api.getDeliveryNotes(statusFilter === "ALL" ? undefined : statusFilter)
      setNotes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delivery notes")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchNotes()
    api.getSettings().then(setSettings).catch(() => {})
  }, [fetchNotes])

  useRealtimeSync({
    onDeliveryNotesChanged: () => fetchNotes(),
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this delivery note?")) return
    try {
      await api.deleteDeliveryNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch {
      alert("Failed to delete delivery note")
    }
  }

  const filtered = notes.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      n.dnNumber.toLowerCase().includes(q) ||
      n.customerName.toLowerCase().includes(q) ||
      (n.salesman || "").toLowerCase().includes(q)
    )
  })

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">Delivery Notes</h1>
              <p className="text-sm text-[#9ca3af] mt-1">
                {notes.length} note{notes.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href="/delivery-notes/new"
              className="inline-flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Create Delivery Note
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by note #, customer, salesman..."
                className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]">
              <p className="text-[#ef4444]">Error: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#171821] rounded-xl p-12 border border-[rgba(255,255,255,0.08)] text-center">
              <Truck className="h-12 w-12 text-[#9ca3af] mx-auto mb-4" />
              <p className="text-[#f3f4f6] font-medium">No delivery notes yet</p>
              <p className="text-sm text-[#9ca3af] mt-1">
                Create a delivery note to accompany shipments to customers.
              </p>
            </div>
          ) : (
            <div className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Delivery Note #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Salesman</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Warehouse</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((dn) => (
                    <tr
                      key={dn.id}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[#21222d]/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">{dn.dnNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">
                        {new Date(dn.deliveryDate || dn.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#f3f4f6]">{dn.customerName}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">{dn.salesman || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">{dn.warehouse || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af] text-center">{dn.itemCount}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">
                        {dn.currency} {parseFloat(dn.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[dn.status]}`}>
                          {dn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <Link
                            href={`/delivery-notes/${dn.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21222d] text-[#f3f4f6] text-xs hover:bg-[#8b5cf6] transition-colors"
                            title="View / Edit"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => printDeliveryNoteDoc(docFromDeliveryNote(dn), settings)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21222d] text-[#f3f4f6] text-xs hover:bg-[#8b5cf6] transition-colors"
                            title="Print / PDF"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(dn.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21222d] text-[#ef4444] text-xs hover:bg-[#ef4444]/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
