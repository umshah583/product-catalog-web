"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Users, Search, CheckCircle, XCircle, Loader2, Clock, Ban, Megaphone, MapPin } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type Customer } from "@/lib/api"
import { useRealtimeSync } from "@/lib/use-realtime-sync"

const STATUS_STYLES: Record<Customer["status"], string> = {
  PENDING: "bg-[#f59e0b]/15 text-[#f59e0b]",
  APPROVED: "bg-[#10b981]/15 text-[#10b981]",
  REJECTED: "bg-[#ef4444]/15 text-[#ef4444]",
  BLOCKED: "bg-[#6b7280]/15 text-[#6b7280]",
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [bcTitle, setBcTitle] = useState("")
  const [bcBody, setBcBody] = useState("")
  const [sending, setSending] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setCustomers(await api.getCustomers())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  useRealtimeSync({ onCustomersChanged: fetchData })

  const setStatus = async (id: string, status: Customer["status"]) => {
    setUpdatingId(id)
    try {
      const updated = await api.updateCustomerStatus(id, status)
      setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcBody.trim()) return
    setSending(true)
    try {
      await api.sendBroadcast(bcTitle.trim(), bcBody.trim())
      setBcTitle("")
      setBcBody("")
      setShowBroadcast(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    )
  })

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#8b5cf6]/15">
                <Users className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f3f4f6]">Customers</h1>
                <p className="text-sm text-[#9ca3af]">
                  Approve mobile app accounts to unlock prices and ordering
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBroadcast(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
              >
                <Megaphone className="h-4 w-4" />
                Send Notification
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers…"
                className="bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] w-64"
              />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 px-4 py-3 text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="rounded-xl bg-[#1a1b26] border border-[rgba(255,255,255,0.08)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
                <Users className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No customers yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[#21222d]/50"
                    >
                      <td className="px-4 py-3 text-[#f3f4f6] font-medium">
                        {c.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">{c.email}</td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        <span className="inline-flex items-center gap-1.5">
                          {c.phone}
                          {c.latitude != null && c.longitude != null && (
                            <a
                              href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Customer location"
                              className="text-[#8b5cf6] hover:text-[#a78bfa]"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {c._count?.orders ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[c.status]}`}
                        >
                          {c.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {c.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                          {c.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {c.status === "BLOCKED" && <Ban className="h-3 w-3" />}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {updatingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#8b5cf6]" />
                          ) : (
                            <>
                              {c.status !== "APPROVED" && (
                                <button
                                  onClick={() => setStatus(c.id, "APPROVED")}
                                  className="rounded-lg bg-[#10b981]/15 px-3 py-1.5 text-xs font-medium text-[#10b981] hover:bg-[#10b981]/25 transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              {c.status !== "REJECTED" && c.status !== "BLOCKED" && (
                                <button
                                  onClick={() => setStatus(c.id, "REJECTED")}
                                  className="rounded-lg bg-[#ef4444]/15 px-3 py-1.5 text-xs font-medium text-[#ef4444] hover:bg-[#ef4444]/25 transition-colors"
                                >
                                  Reject
                                </button>
                              )}
                              {c.status !== "BLOCKED" ? (
                                <button
                                  onClick={() => setStatus(c.id, "BLOCKED")}
                                  className="rounded-lg bg-[#6b7280]/15 px-3 py-1.5 text-xs font-medium text-[#9ca3af] hover:bg-[#6b7280]/25 hover:text-[#e5e7eb] transition-colors"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => setStatus(c.id, "APPROVED")}
                                  className="rounded-lg bg-[#8b5cf6]/15 px-3 py-1.5 text-xs font-medium text-[#8b5cf6] hover:bg-[#8b5cf6]/25 transition-colors"
                                >
                                  Unblock
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showBroadcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl bg-[#1a1b26] border border-[rgba(255,255,255,0.08)] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8b5cf6]/15">
                  <Megaphone className="h-5 w-5 text-[#8b5cf6]" />
                </div>
                <h2 className="text-lg font-bold text-[#f3f4f6]">Broadcast to Customers</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Title</label>
                <input
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. New offers this week!"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Message</label>
                <textarea
                  value={bcBody}
                  onChange={(e) => setBcBody(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Write your announcement…"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBroadcast(false)}
                  className="rounded-lg px-4 py-2 text-sm text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendBroadcast}
                  disabled={sending || !bcTitle.trim() || !bcBody.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send to all customers
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
