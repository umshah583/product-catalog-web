"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import {
  ShoppingCart,
  Loader2,
  Search,
  Eye,
  X,
  Package,
  Phone,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type Order, type Settings } from "@/lib/api"
import { useRealtimeSync } from "@/lib/use-realtime-sync"
import { printDeliveryNoteDoc, docFromOrder } from "@/lib/delivery-note"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[#f59e0b]/20 text-[#f59e0b]",
  CONFIRMED: "bg-[#3b82f6]/20 text-[#3b82f6]",
  COMPLETED: "bg-[#10b981]/20 text-[#10b981]",
  CANCELLED: "bg-[#ef4444]/20 text-[#ef4444]",
}

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getOrders(statusFilter === "ALL" ? undefined : statusFilter)
      setOrders(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
    api.getSettings().then(setSettings).catch(() => {})
  }, [fetchOrders])

  // Realtime: refresh when a new order arrives or is updated
  useRealtimeSync({
    onOrdersChanged: () => {
      fetchOrders()
    },
  })

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingStatus(true)
    try {
      const updated = await api.updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      if (selectedOrder?.id === orderId) setSelectedOrder(updated)
    } catch (err) {
      alert("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const filtered = orders.filter((o) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q)
    )
  })

  const pendingCount = orders.filter((o) => o.status === "PENDING").length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">Orders</h1>
              {pendingCount > 0 && (
                <p className="text-sm text-[#f59e0b] mt-1">
                  {pendingCount} pending order{pendingCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, customer, phone..."
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

          {/* Content */}
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
              <ShoppingCart className="h-12 w-12 text-[#9ca3af] mx-auto mb-4" />
              <p className="text-[#f3f4f6] font-medium">No orders yet</p>
              <p className="text-sm text-[#9ca3af] mt-1">
                Orders placed from the mobile app will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Order #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[#21222d]/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#f3f4f6]">{order.customerName}</div>
                        <div className="text-xs text-[#9ca3af]">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">{order.itemCount}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#f3f4f6]">
                        {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af]">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#21222d] text-[#f3f4f6] text-xs hover:bg-[#8b5cf6] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="text-lg font-bold text-[#f3f4f6]">
                  {selectedOrder.orderNumber}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printDeliveryNoteDoc(docFromOrder(selectedOrder), settings)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21222d] text-[#f3f4f6] text-xs hover:bg-[#8b5cf6] transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Delivery Note
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-[#9ca3af] hover:text-[#f3f4f6]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Customer */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#f3f4f6]">
                    <User className="h-4 w-4 text-[#9ca3af]" />
                    {selectedOrder.customerName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.customerPhone}
                  </div>
                  {selectedOrder.customerAddress && (
                    <div className="text-sm text-[#9ca3af] pl-6">
                      {selectedOrder.customerAddress}
                    </div>
                  )}
                  {selectedOrder.customerEmail && (
                    <div className="text-sm text-[#9ca3af] pl-6">
                      {selectedOrder.customerEmail}
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="flex items-start gap-2 text-sm text-[#9ca3af]">
                      <FileText className="h-4 w-4 mt-0.5" />
                      {selectedOrder.notes}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                  <h3 className="text-sm font-semibold text-[#9ca3af] uppercase mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Items
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm bg-[#21222d] rounded-lg px-3 py-2"
                      >
                        <div>
                          <div className="text-[#f3f4f6]">{item.productName}</div>
                          <div className="text-xs text-[#9ca3af]">
                            {[item.brand, item.sku && `SKU: ${item.sku}`]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#f3f4f6]">x{item.quantity}</div>
                          <div className="text-xs text-[#9ca3af]">
                            {parseFloat(item.lineTotal).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                    <span className="font-semibold text-[#f3f4f6]">Total</span>
                    <span className="font-bold text-[#8b5cf6]">
                      {selectedOrder.currency} {parseFloat(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Status actions */}
                <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                  <h3 className="text-sm font-semibold text-[#9ca3af] uppercase mb-3">
                    Update Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((s) => (
                      <button
                        key={s}
                        disabled={updatingStatus || selectedOrder.status === s}
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                          selectedOrder.status === s
                            ? STATUS_COLORS[s]
                            : "bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6]"
                        }`}
                      >
                        {s === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                        {s === "CONFIRMED" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {s === "COMPLETED" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {s === "CANCELLED" && <XCircle className="h-3.5 w-3.5" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
