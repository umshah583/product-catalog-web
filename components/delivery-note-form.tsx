"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Plus,
  Trash2,
  Printer,
  FileDown,
  Eye,
  Save,
  CheckCircle2,
  User,
  Truck,
  Package,
} from "lucide-react"
import {
  api,
  type DeliveryNote,
  type DeliveryNoteItemInput,
  type Order,
  type Product,
  type Settings,
} from "@/lib/api"
import { printDeliveryNoteDoc, docFromDeliveryNote } from "@/lib/delivery-note"

interface ItemRow extends DeliveryNoteItemInput {
  _key: number
}

const inputCls =
  "w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
const labelCls = "block text-xs font-medium text-[#9ca3af] mb-1.5"

let keySeq = 0
const newRow = (): ItemRow => ({
  _key: ++keySeq,
  productName: "",
  brand: "",
  sku: "",
  barcode: "",
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
})

export function DeliveryNoteForm({ existing }: { existing?: DeliveryNote }) {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState<DeliveryNote | null>(existing ?? null)

  // Customer
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerName, setCustomerName] = useState(existing?.customerName ?? "")
  const [customerTrn, setCustomerTrn] = useState(existing?.customerTrn ?? "")
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone ?? "")
  const [customerEmail, setCustomerEmail] = useState(existing?.customerEmail ?? "")
  const [billingAddress, setBillingAddress] = useState(existing?.billingAddress ?? "")
  const [shippingAddress, setShippingAddress] = useState(existing?.shippingAddress ?? "")

  // Delivery info
  const [deliveryDate, setDeliveryDate] = useState(
    existing?.deliveryDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  )
  const [orderRef, setOrderRef] = useState(existing?.orderId ?? "")
  const [salesman, setSalesman] = useState(existing?.salesman ?? "")
  const [warehouse, setWarehouse] = useState(existing?.warehouse ?? "")
  const [driver, setDriver] = useState(existing?.driver ?? "")
  const [vehicleNumber, setVehicleNumber] = useState(existing?.vehicleNumber ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")

  const [items, setItems] = useState<ItemRow[]>(
    existing?.items.length
      ? existing.items.map((i) => ({
          _key: ++keySeq,
          productId: i.productId ?? undefined,
          productName: i.productName,
          brand: i.brand ?? "",
          sku: i.sku ?? "",
          barcode: i.barcode ?? "",
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          lineTotal: parseFloat(i.lineTotal),
        }))
      : [newRow()]
  )

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {})
    api.getProducts().then(setProducts).catch(() => {})
    api.getOrders().then(setOrders).catch(() => {})
  }, [])

  // Unique customers seen on previous orders — powers the customer search
  const knownCustomers = useMemo(() => {
    const map = new Map<string, Order>()
    for (const o of orders) {
      const key = `${o.customerName}|${o.customerPhone}`
      if (!map.has(key)) map.set(key, o)
    }
    return [...map.values()]
  }, [orders])

  const customerMatches = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return []
    return knownCustomers
      .filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      )
      .slice(0, 5)
  }, [customerSearch, knownCustomers])

  const pickCustomer = (o: Order) => {
    setCustomerName(o.customerName)
    setCustomerPhone(o.customerPhone)
    setCustomerEmail(o.customerEmail ?? "")
    if (o.customerAddress) {
      setBillingAddress(o.customerAddress)
      setShippingAddress(o.customerAddress)
    }
    setCustomerSearch("")
  }

  const currency = settings?.currency ?? "AED"
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0)
  const totalAmount = items.reduce((s, i) => s + (i.lineTotal || 0), 0)
  const filledItems = items.filter((i) => i.productName.trim())

  const updateItem = (key: number, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row._key !== key) return row
        const next = { ...row, ...patch }
        next.lineTotal = next.quantity * next.unitPrice
        return next
      })
    )
  }

  const pickProduct = (key: number, productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    const price = Number(p.discountPrice ?? p.price)
    updateItem(key, {
      productId: p.id,
      productName: p.name,
      brand: p.brand ?? "",
      sku: p.sku ?? "",
      unitPrice: price,
    })
  }

  const buildPayload = () => {
    const linkedOrder = orders.find((o) => o.id === orderRef)
    return {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerTrn: customerTrn.trim() || undefined,
      billingAddress: billingAddress.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
      notes: notes.trim() || undefined,
      salesman: salesman.trim() || undefined,
      warehouse: warehouse.trim() || undefined,
      driver: driver.trim() || undefined,
      vehicleNumber: vehicleNumber.trim() || undefined,
      orderId: linkedOrder?.id,
      orderNumber: linkedOrder?.orderNumber,
      deliveryDate,
      totalAmount,
      currency,
      items: filledItems.map(({ _key, ...rest }) => rest),
    }
  }

  const validate = () => {
    if (!customerName.trim()) return "Customer name is required"
    if (!customerPhone.trim()) return "Customer phone is required"
    if (filledItems.length === 0) return "Add at least one product"
    return null
  }

  const save = async (status?: "DRAFT" | "PENDING" | "DELIVERED") => {
    const err = validate()
    if (err) {
      alert(err)
      return null
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      let dn = current
        ? await api.updateDeliveryNote(current.id, payload)
        : await api.createDeliveryNote(payload)
      if (status && status !== dn.status) {
        dn = await api.updateDeliveryNoteStatus(dn.id, status)
      }
      setCurrent(dn)
      return dn
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save")
      return null
    } finally {
      setSaving(false)
    }
  }

  const onSaveDraft = async () => {
    const dn = await save("DRAFT")
    if (dn) router.push("/delivery-notes")
  }

  const onConfirmDelivery = async () => {
    const dn = await save("DELIVERED")
    if (dn) router.push("/delivery-notes")
  }

  const onPrint = async () => {
    const dn = await save()
    if (dn) printDeliveryNoteDoc(docFromDeliveryNote(dn), settings)
  }

  const onPreview = async () => {
    const err = validate()
    if (err) {
      alert(err)
      return
    }
    const payload = buildPayload()
    const preview: DeliveryNote = {
      ...(current ?? ({} as DeliveryNote)),
      id: current?.id ?? "preview",
      dnNumber: current?.dnNumber ?? "DN-PREVIEW",
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail ?? null,
      customerTrn: payload.customerTrn ?? null,
      billingAddress: payload.billingAddress ?? null,
      shippingAddress: payload.shippingAddress ?? null,
      notes: payload.notes ?? null,
      status: current?.status ?? "DRAFT",
      salesman: payload.salesman ?? null,
      warehouse: payload.warehouse ?? null,
      driver: payload.driver ?? null,
      vehicleNumber: payload.vehicleNumber ?? null,
      orderId: payload.orderId ?? null,
      orderNumber: payload.orderNumber ?? null,
      deliveryDate: payload.deliveryDate ?? null,
      totalAmount: String(payload.totalAmount),
      currency: payload.currency ?? currency,
      itemCount: totalQty,
      items: payload.items.map((i, idx) => ({
        id: String(idx),
        deliveryNoteId: "preview",
        productId: i.productId ?? null,
        productName: i.productName,
        brand: i.brand ?? null,
        sku: i.sku ?? null,
        barcode: i.barcode ?? null,
        quantity: i.quantity,
        unitPrice: String(i.unitPrice),
        lineTotal: String(i.lineTotal),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    printDeliveryNoteDoc(docFromDeliveryNote(preview), settings)
  }

  return (
    <div className="space-y-6">
      {/* Customer */}
      <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <h2 className="text-lg font-bold text-[#f3f4f6] mb-5 flex items-center gap-2">
          <User className="h-5 w-5" /> Customer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative md:col-span-2">
            <label className={labelCls}>Customer Search</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search previous customers by name or phone..."
              className={inputCls}
            />
            {customerMatches.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-[#21222d] border border-[rgba(255,255,255,0.12)] rounded-lg overflow-hidden shadow-xl">
                {customerMatches.map((o) => (
                  <button
                    key={`${o.customerName}|${o.customerPhone}`}
                    onClick={() => pickCustomer(o)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#f3f4f6] hover:bg-[#8b5cf6]/20"
                  >
                    {o.customerName}
                    <span className="text-[#9ca3af] ml-2">{o.customerPhone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Customer Name *</label>
            <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TRN</label>
            <input className={inputCls} value={customerTrn} onChange={(e) => setCustomerTrn(e.target.value)} placeholder="100XXXXXXXXXXX" />
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input className={inputCls} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+971 50 123 4567" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Billing Address</label>
            <input className={inputCls} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Dubai, UAE" />
          </div>
          <div>
            <label className={labelCls}>Shipping Address</label>
            <input className={inputCls} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Dubai, UAE" />
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <h2 className="text-lg font-bold text-[#f3f4f6] mb-5 flex items-center gap-2">
          <Truck className="h-5 w-5" /> Delivery Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Delivery Note Number</label>
            <input className={`${inputCls} opacity-60`} value={current?.dnNumber ?? "Auto-generated"} disabled />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sales Order</label>
            <select className={inputCls} value={orderRef} onChange={(e) => setOrderRef(e.target.value)}>
              <option value="">— None —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.customerName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Salesman</label>
            <input className={inputCls} value={salesman} onChange={(e) => setSalesman(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Warehouse</label>
            <input className={inputCls} value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Delivery Driver</label>
            <input className={inputCls} value={driver} onChange={(e) => setDriver(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Vehicle Number</label>
            <input className={inputCls} value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Notes</label>
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions..." />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <h2 className="text-lg font-bold text-[#f3f4f6] mb-5 flex items-center gap-2">
          <Package className="h-5 w-5" /> Products
        </h2>
        <div className="space-y-3">
          {items.map((row) => (
            <div
              key={row._key}
              className="grid grid-cols-12 gap-2 items-end bg-[#21222d]/60 rounded-lg p-3"
            >
              <div className="col-span-12 md:col-span-3">
                <label className={labelCls}>Product</label>
                <select
                  className={inputCls}
                  value={row.productId ?? ""}
                  onChange={(e) => {
                    if (e.target.value) pickProduct(row._key, e.target.value)
                  }}
                >
                  <option value="">Select or type below</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!row.productId && (
                  <input
                    className={`${inputCls} mt-1.5`}
                    placeholder="Product name"
                    value={row.productName}
                    onChange={(e) => updateItem(row._key, { productName: e.target.value })}
                  />
                )}
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className={labelCls}>Brand</label>
                <input className={inputCls} value={row.brand ?? ""} onChange={(e) => updateItem(row._key, { brand: e.target.value })} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className={labelCls}>Model / SKU</label>
                <input className={inputCls} value={row.sku ?? ""} onChange={(e) => updateItem(row._key, { sku: e.target.value })} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className={labelCls}>Barcode</label>
                <input className={inputCls} value={row.barcode ?? ""} onChange={(e) => updateItem(row._key, { barcode: e.target.value })} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className={labelCls}>Qty</label>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={row.quantity}
                  onChange={(e) => updateItem(row._key, { quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className={labelCls}>Unit Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={row.unitPrice}
                  onChange={(e) => updateItem(row._key, { unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className={labelCls}>Total</label>
                <div className="bg-[#171821] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] font-medium">
                  {row.lineTotal.toFixed(2)}
                </div>
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button
                  onClick={() => setItems((prev) => prev.filter((r) => r._key !== row._key))}
                  className="p-2 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setItems((prev) => [...prev, newRow()])}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#8b5cf6]/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Summary + Actions */}
      <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-[#9ca3af] uppercase">Total Items</div>
              <div className="text-lg font-bold text-[#f3f4f6]">{filledItems.length}</div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] uppercase">Total Quantity</div>
              <div className="text-lg font-bold text-[#f3f4f6]">{totalQty}</div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] uppercase">Total Amount</div>
              <div className="text-lg font-bold text-[#8b5cf6]">
                {currency} {totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] transition-colors"
            >
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              onClick={onPrint}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
            <button
              onClick={onConfirmDelivery}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10b981] text-white text-sm font-medium hover:bg-[#0da271] transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
