"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Eye,
  Send,
  FileCheck,
  User,
  MapPin,
  Building2,
  Landmark,
  CreditCard,
  Stamp,
  PenTool,
  X,
} from "lucide-react"
import {
  api,
  type CreditApplication,
  type CreditApplicationInput,
  type Order,
} from "@/lib/api"

const inputCls =
  "w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
const labelCls = "block text-xs font-medium text-[#9ca3af] mb-1.5"
const sectionCls =
  "bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]"
const h2Cls = "text-lg font-bold text-[#f3f4f6] mb-5 flex items-center gap-2"

const DOC_ITEMS = [
  "Signed & stamped Credit Application Form",
  "Valid full Trade License — all pages (Sole Establishment), or Trade License + MOA (LLC)",
  "Passport, valid UAE Residence Visa and Emirates ID of Owner / Partner(s) / Manager(s) and Warrantor",
  "Notarised / attested Power of Attorney (POA)",
  "Valid Tax Registration Certificate (TRN Certificate)",
  "Security cheque",
  "Trade / bank references — minimum two (2) suppliers",
  "Company profile / latest audited or management financial statements",
]

const LEGAL_TYPES = [
  { value: "LLC", label: "LLC" },
  { value: "ONE_PERSON_LLC", label: "One Person LLC" },
  { value: "SOLE_ESTABLISHMENT", label: "Sole Establishment" },
  { value: "FZC", label: "FZC" },
  { value: "FZE", label: "FZE" },
  { value: "CIVIL_COMPANY", label: "Civil Company" },
  { value: "OTHER", label: "Other" },
]

function SignaturePad({
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

export function CreditApplicationForm({ existing }: { existing?: CreditApplication }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState<CreditApplication | null>(existing ?? null)
  const fd = (existing?.formData ?? {}) as Record<string, any>

  // Customer
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerName, setCustomerName] = useState(existing?.customerName ?? "")
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone ?? "")
  const [customerEmail, setCustomerEmail] = useState(existing?.customerEmail ?? "")
  const [customerTrn, setCustomerTrn] = useState(existing?.customerTrn ?? "")

  // Form fields (keys mirror the PDF map)
  const [appDate, setAppDate] = useState(fd.appDate ?? new Date().toISOString().slice(0, 10))
  const [commercialName, setCommercialName] = useState(fd.commercialName ?? existing?.customerName ?? "")
  const [trn, setTrn] = useState(fd.trn ?? existing?.customerTrn ?? "")
  const [docs, setDocs] = useState<Record<string, { received: boolean; remarks: string }>>(() => {
    const init: Record<string, { received: boolean; remarks: string }> = {}
    for (let i = 1; i <= 8; i++)
      init[String(i)] = {
        received: fd.documents?.[String(i)]?.received ?? false,
        remarks: fd.documents?.[String(i)]?.remarks ?? "",
      }
    return init
  })
  const [companyName, setCompanyName] = useState(fd.companyName ?? "")
  const [licenseNo, setLicenseNo] = useState(fd.licenseNo ?? "")
  const [issueDate, setIssueDate] = useState(fd.issueDate ?? "")
  const [expiryDate, setExpiryDate] = useState(fd.expiryDate ?? "")
  const [legalType, setLegalType] = useState(fd.legalType ?? "")
  const [legalOther, setLegalOther] = useState(fd.legalOther ?? "")
  const [address, setAddress] = useState<Record<string, string>>({
    emirate: fd.emirate ?? "",
    area: fd.area ?? "",
    street: fd.street ?? "",
    landmark: fd.landmark ?? "",
    building: fd.building ?? "",
    shopNo: fd.shopNo ?? "",
    telMobile: fd.telMobile ?? "",
    fax: fd.fax ?? "",
    email: fd.email ?? "",
    poBox: fd.poBox ?? "",
    makani: fd.makani ?? "",
  })
  const [owners, setOwners] = useState<any[]>(fd.owners?.length ? fd.owners : [{ name: "", capacity: "", nationality: "", contact: "" }])
  const [banks, setBanks] = useState<any[]>(fd.banks?.length ? fd.banks : [{ bankName: "", branch: "", accountNo: "", iban: "" }])
  const [creditAmount, setCreditAmount] = useState(fd.creditAmount ?? "")
  const [paymentTerms, setPaymentTerms] = useState(fd.paymentTerms ?? "")
  const [paymentTermsOther, setPaymentTermsOther] = useState(fd.paymentTermsOther ?? "")
  const [vatCompanyName, setVatCompanyName] = useState(fd.vatCompanyName ?? "")
  const [vatTrn, setVatTrn] = useState(fd.vatTrn ?? "")
  const [references, setReferences] = useState<any[]>(
    fd.references?.length ? fd.references : [{ companyName: "", contactPerson: "", mobile: "", licenseNo: "" }, { companyName: "", contactPerson: "", mobile: "", licenseNo: "" }]
  )
  const [signerName, setSignerName] = useState(fd.signerName ?? "")
  const [signerDate, setSignerDate] = useState(fd.signerDate ?? "")
  const [initials, setInitials] = useState(existing?.initials ?? "")
  const [signatureData, setSignatureData] = useState<string | null>(existing?.signatureData ?? null)
  const [stampData, setStampData] = useState<string | null>(existing?.stampData ?? null)

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => {})
  }, [])

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
      .filter((o) => o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q))
      .slice(0, 5)
  }, [customerSearch, knownCustomers])

  const pickCustomer = (o: Order) => {
    setCustomerName(o.customerName)
    setCustomerPhone(o.customerPhone)
    setCustomerEmail(o.customerEmail ?? "")
    setCommercialName((prev: string) => prev || o.customerName)
    setCompanyName((prev: string) => prev || o.customerName)
    if (o.customerAddress) {
      setAddress((prev) => ({ ...prev, area: o.customerAddress || prev.area }))
    }
    setCustomerSearch("")
  }

  const buildFormData = () => ({
    appDate,
    commercialName,
    trn,
    documents: docs,
    companyName,
    licenseNo,
    issueDate,
    expiryDate,
    legalType,
    legalOther,
    ...address,
    owners: owners.filter((o) => o.name),
    banks: banks.filter((b) => b.bankName),
    creditAmount,
    paymentTerms,
    paymentTermsOther,
    vatCompanyName,
    vatTrn,
    references: references.filter((r) => r.companyName),
    signerName,
    signerDate,
  })

  const validate = () => {
    if (!customerName.trim()) return "Customer name is required"
    if (!commercialName.trim()) return "Commercial name is required"
    return null
  }

  const save = async (submit = false): Promise<CreditApplication | null> => {
    const err = validate()
    if (err) {
      alert(err)
      return null
    }
    setSaving(true)
    try {
      const payload: CreditApplicationInput = {
        customerName: customerName.trim(),
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        customerTrn: customerTrn || trn || undefined,
        formData: buildFormData(),
        signatureData: signatureData ?? undefined,
        stampData: stampData ?? undefined,
        initials: initials || undefined,
      }
      let app = current
        ? await api.updateCreditApplication(current.id, payload)
        : await api.createCreditApplication(payload)
      if (submit && app.status === "DRAFT") {
        app = await api.updateCreditAppStatus(app.id, "SUBMITTED")
      }
      setCurrent(app)
      return app
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save")
      return null
    } finally {
      setSaving(false)
    }
  }

  const previewPdf = async () => {
    const app = await save()
    if (!app) return
    try {
      const blob = await api.fetchCreditAppPdf(app.id)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch {
      alert("Failed to generate PDF preview")
    }
  }

  const updateOwner = (i: number, patch: any) =>
    setOwners((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const updateBank = (i: number, patch: any) =>
    setBanks((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const updateRef = (i: number, patch: any) =>
    setReferences((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const readonly = current?.status === "APPROVED"

  return (
    <div className="space-y-6">
      {/* Customer */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><User className="h-5 w-5" /> Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative md:col-span-2">
            <label className={labelCls}>Customer Search (from order history)</label>
            <input
              className={inputCls}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search previous customers..."
              disabled={readonly}
            />
            {customerMatches.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-[#21222d] border border-[rgba(255,255,255,0.12)] rounded-lg overflow-hidden shadow-xl">
                {customerMatches.map((o) => (
                  <button key={`${o.customerName}|${o.customerPhone}`} onClick={() => pickCustomer(o)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#f3f4f6] hover:bg-[#8b5cf6]/20">
                    {o.customerName}<span className="text-[#9ca3af] ml-2">{o.customerPhone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Customer Name *</label>
            <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Application Date</label>
            <input type="date" className={inputCls} value={appDate} onChange={(e) => setAppDate(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Customer Commercial Name (as per Trade License) *</label>
            <input className={inputCls} value={commercialName} onChange={(e) => setCommercialName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Customer VAT / TRN Number</label>
            <input className={inputCls} value={trn} onChange={(e) => setTrn(e.target.value)} disabled={readonly} />
          </div>
        </div>
      </div>

      {/* Required Documents checklist */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><FileCheck className="h-5 w-5" /> Required Documents Checklist</h2>
        <div className="space-y-2">
          {DOC_ITEMS.map((label, i) => {
            const k = String(i + 1)
            return (
              <div key={k} className="flex items-start gap-3 bg-[#21222d]/60 rounded-lg px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={docs[k].received}
                  onChange={(e) => setDocs((p) => ({ ...p, [k]: { ...p[k], received: e.target.checked } }))}
                  className="mt-1 h-4 w-4 accent-[#8b5cf6]"
                  disabled={readonly}
                />
                <div className="flex-1">
                  <div className="text-sm text-[#f3f4f6]"><span className="text-[#9ca3af] mr-1.5">{i + 1}.</span>{label}</div>
                  {docs[k].received && (
                    <input
                      className={`${inputCls} mt-1.5 text-xs`}
                      placeholder="Remarks (optional)"
                      value={docs[k].remarks}
                      onChange={(e) => setDocs((p) => ({ ...p, [k]: { ...p[k], remarks: e.target.value } }))}
                      disabled={readonly}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trade License */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><Building2 className="h-5 w-5" /> Trade License Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Company Name (Section 2)</label>
            <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>License No.</label>
            <input className={inputCls} value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Date of Issue</label>
            <input className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} placeholder="DD-MM-YYYY" disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Expiry Date</label>
            <input className={inputCls} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="DD-MM-YYYY" disabled={readonly} />
          </div>
          <div className="md:col-span-3">
            <label className={labelCls}>Legal Type</label>
            <div className="flex flex-wrap gap-2">
              {LEGAL_TYPES.map((t) => (
                <button key={t.value} type="button" disabled={readonly}
                  onClick={() => setLegalType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${legalType === t.value ? "bg-[#8b5cf6] text-white" : "bg-[#21222d] text-[#9ca3af] hover:text-[#f3f4f6]"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {legalType === "OTHER" && (
              <input className={`${inputCls} mt-2`} placeholder="Specify other" value={legalOther} onChange={(e) => setLegalOther(e.target.value)} disabled={readonly} />
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><MapPin className="h-5 w-5" /> Address Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["emirate", "Emirate"], ["area", "Area"], ["street", "Street"],
            ["landmark", "Landmark"], ["building", "Building"], ["shopNo", "Shop No."],
            ["telMobile", "Tel / Mobile"], ["fax", "Fax"], ["email", "Email"],
            ["poBox", "P.O. Box"], ["makani", "Makani Number"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} value={address[key]} onChange={(e) => setAddress((p) => ({ ...p, [key]: e.target.value }))} disabled={readonly} />
            </div>
          ))}
        </div>
      </div>

      {/* Owners */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><User className="h-5 w-5" /> Owner / Partners / Manager</h2>
        <div className="space-y-3">
          {owners.map((o, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end bg-[#21222d]/60 rounded-lg p-3">
              {[["name", "Name", 4], ["capacity", "Capacity", 3], ["nationality", "Nationality", 2], ["contact", "Contact Number", 2]].map(([k, l, span]) => (
                <div key={k as string} className={`col-span-6 md:col-span-${span}`}>
                  <label className={labelCls}>{l}</label>
                  <input className={inputCls} value={o[k as string] ?? ""} onChange={(e) => updateOwner(i, { [k as string]: e.target.value })} disabled={readonly} />
                </div>
              ))}
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button type="button" onClick={() => setOwners((p) => p.filter((_, j) => j !== i))} disabled={readonly}
                  className="p-2 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {owners.length < 4 && !readonly && (
          <button type="button" onClick={() => setOwners((p) => [...p, { name: "", capacity: "", nationality: "", contact: "" }])}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#8b5cf6]/30">
            <Plus className="h-4 w-4" /> Add Row
          </button>
        )}
      </div>

      {/* Banks */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><Landmark className="h-5 w-5" /> Authorised Bank Accounts</h2>
        <div className="space-y-3">
          {banks.map((b, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end bg-[#21222d]/60 rounded-lg p-3">
              {[["bankName", "Bank Name", 4], ["branch", "Branch", 3], ["accountNo", "Account No.", 2], ["iban", "IBAN", 2]].map(([k, l, span]) => (
                <div key={k as string} className={`col-span-6 md:col-span-${span}`}>
                  <label className={labelCls}>{l}</label>
                  <input className={inputCls} value={b[k as string] ?? ""} onChange={(e) => updateBank(i, { [k as string]: e.target.value })} disabled={readonly} />
                </div>
              ))}
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button type="button" onClick={() => setBanks((p) => p.filter((_, j) => j !== i))} disabled={readonly}
                  className="p-2 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {banks.length < 4 && !readonly && (
          <button type="button" onClick={() => setBanks((p) => [...p, { bankName: "", branch: "", accountNo: "", iban: "" }])}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#8b5cf6]/30">
            <Plus className="h-4 w-4" /> Add Row
          </button>
        )}
      </div>

      {/* Credit Limit + VAT */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><CreditCard className="h-5 w-5" /> Credit Limit & VAT Registration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Amount Requested (AED)</label>
            <input type="number" className={inputCls} value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Payment Terms</label>
            <div className="flex flex-wrap gap-2">
              {["15", "30", "OTHER"].map((t) => (
                <button key={t} type="button" disabled={readonly}
                  onClick={() => setPaymentTerms(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${paymentTerms === t ? "bg-[#8b5cf6] text-white" : "bg-[#21222d] text-[#9ca3af]"}`}>
                  {t === "OTHER" ? "Other" : `${t} days`}
                </button>
              ))}
            </div>
            {paymentTerms === "OTHER" && (
              <input className={`${inputCls} mt-2`} placeholder="Specify terms" value={paymentTermsOther} onChange={(e) => setPaymentTermsOther(e.target.value)} disabled={readonly} />
            )}
          </div>
          <div>
            <label className={labelCls}>VAT Company Name</label>
            <input className={inputCls} value={vatCompanyName} onChange={(e) => setVatCompanyName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>VAT TRN Number</label>
            <input className={inputCls} value={vatTrn} onChange={(e) => setVatTrn(e.target.value)} disabled={readonly} />
          </div>
        </div>
      </div>

      {/* Trade References */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><Landmark className="h-5 w-5" /> Trade References (minimum two)</h2>
        <div className="space-y-3">
          {references.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end bg-[#21222d]/60 rounded-lg p-3">
              {[["companyName", "Company Name", 4], ["contactPerson", "Contact Person", 3], ["mobile", "Mobile", 2], ["licenseNo", "Trade License No.", 2]].map(([k, l, span]) => (
                <div key={k as string} className={`col-span-6 md:col-span-${span}`}>
                  <label className={labelCls}>{l}</label>
                  <input className={inputCls} value={r[k as string] ?? ""} onChange={(e) => updateRef(i, { [k as string]: e.target.value })} disabled={readonly} />
                </div>
              ))}
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button type="button" onClick={() => setReferences((p) => p.filter((_, j) => j !== i))} disabled={readonly}
                  className="p-2 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {references.length < 3 && !readonly && (
          <button type="button" onClick={() => setReferences((p) => [...p, { companyName: "", contactPerson: "", mobile: "", licenseNo: "" }])}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#8b5cf6]/30">
            <Plus className="h-4 w-4" /> Add Row
          </button>
        )}
      </div>

      {/* Signature & Stamp */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><PenTool className="h-5 w-5" /> Signature & Company Stamp</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Signature (draw or upload)</label>
            {!readonly ? (
              <SignaturePad value={signatureData} onChange={setSignatureData} />
            ) : signatureData ? (
              <img src={signatureData} alt="signature" className="w-full max-w-md bg-white rounded-lg border border-[rgba(255,255,255,0.15)]" />
            ) : (
              <p className="text-xs text-[#9ca3af]">No signature</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Company Stamp (upload image)</label>
            {!readonly ? (
              <div>
                {stampData ? (
                  <div className="relative inline-block">
                    <img src={stampData} alt="stamp" className="w-40 h-40 object-contain bg-white rounded-lg border border-[rgba(255,255,255,0.15)]" />
                    <button type="button" onClick={() => setStampData(null)}
                      className="absolute -top-2 -right-2 bg-[#ef4444] text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#21222d] text-[#9ca3af] cursor-pointer hover:text-[#f3f4f6]">
                    <Stamp className="h-4 w-4" /> Choose stamp image
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const reader = new FileReader()
                        reader.onload = () => setStampData(reader.result as string)
                        reader.readAsDataURL(f)
                      }} />
                  </label>
                )}
              </div>
            ) : stampData ? (
              <img src={stampData} alt="stamp" className="w-40 h-40 object-contain bg-white rounded-lg border" />
            ) : (
              <p className="text-xs text-[#9ca3af]">No stamp</p>
            )}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className={labelCls}>Signer Name</label>
                <input className={inputCls} value={signerName} onChange={(e) => setSignerName(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <label className={labelCls}>Sign Date</label>
                <input className={inputCls} value={signerDate} onChange={(e) => setSignerDate(e.target.value)} placeholder="DD-MM-YYYY" disabled={readonly} />
              </div>
              <div>
                <label className={labelCls}>Initials (every page)</label>
                <input className={inputCls} value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. US" disabled={readonly} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save(false)} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
          </button>
          <button onClick={previewPdf} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] disabled:opacity-50">
            <Eye className="h-4 w-4" /> Preview PDF
          </button>
          <button onClick={async () => { const a = await save(true); if (a) window.location.href = `/credit-applications/${a.id}` }} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10b981] text-white text-sm font-medium hover:bg-[#0da271] disabled:opacity-50">
            <Send className="h-4 w-4" /> Submit for Review
          </button>
        </div>
      )}
    </div>
  )
}
