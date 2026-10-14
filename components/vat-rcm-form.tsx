"use client"

import { useState } from "react"
import {
  Loader2,
  Save,
  Eye,
  Send,
  FileCheck,
  User,
  Building2,
  Stamp,
  PenTool,
  X,
  FileText,
} from "lucide-react"
import { api, type CreditApplication, type CreditApplicationInput } from "@/lib/api"
import { SignaturePad } from "@/components/signature-pad"

const inputCls =
  "w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
const labelCls = "block text-xs font-medium text-[#9ca3af] mb-1.5"
const sectionCls =
  "bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]"
const h2Cls = "text-lg font-bold text-[#f3f4f6] mb-5 flex items-center gap-2"

const radioCls = "h-4 w-4 accent-[#8b5cf6]"

/**
 * VAT RCM declaration — mirrors the printed form's fields; values map
 * 1:1 onto vat-rcm-v1.map.json for PDF overlay.
 */
export function VatRcmForm({ existing }: { existing?: CreditApplication }) {
  const fd = (existing?.formData ?? {}) as Record<string, any>
  const readonly = !!existing && existing.status !== "DRAFT"

  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState<CreditApplication | null>(existing ?? null)

  const [date, setDate] = useState(
    fd.date ?? new Date().toISOString().slice(0, 10)
  )
  const [from1, setFrom1] = useState(fd.from1 ?? "")
  const [from2, setFrom2] = useState(fd.from2 ?? "")
  const [declarantName, setDeclarantName] = useState(fd.declarantName ?? "")
  const [eid, setEid] = useState(fd.eid ?? "")
  const [onBehalf, setOnBehalf] = useState(fd.onBehalf ?? "")
  const [purpose, setPurpose] = useState<string>(fd.purpose ?? "RESALE")
  const [trn, setTrn] = useState(fd.trn ?? existing?.customerTrn ?? "")
  const [companyName, setCompanyName] = useState(
    fd.companyName ?? existing?.customerName ?? ""
  )
  const [address, setAddress] = useState(fd.address ?? "")
  const [liableMs, setLiableMs] = useState(fd.liableMs ?? "")
  const [authority, setAuthority] = useState<string>(fd.authority ?? "SIGNATORY")
  const [signerName, setSignerName] = useState(fd.signerName ?? "")
  const [designation, setDesignation] = useState(fd.designation ?? "")
  const [contactNo, setContactNo] = useState(fd.contactNo ?? "")
  const [signatureData, setSignatureData] = useState<string | null>(
    existing?.signatureData ?? null
  )
  const [stampData, setStampData] = useState<string | null>(
    existing?.stampData ?? null
  )

  const validate = (): string | null => {
    if (!companyName.trim()) return "Company name is required"
    if (!declarantName.trim()) return "Declarant name is required"
    if (!trn.trim()) return "TRN is required"
    return null
  }

  const buildFormData = () => ({
    date,
    from1,
    from2,
    declarantName,
    eid,
    onBehalf,
    purpose,
    trn,
    companyName,
    address,
    liableMs: liableMs || companyName,
    authority,
    signerName,
    designation,
    contactNo,
  })

  const save = async (submit = false): Promise<CreditApplication | null> => {
    const err = validate()
    if (err) {
      alert(err)
      return null
    }
    setSaving(true)
    try {
      const payload: CreditApplicationInput = {
        customerName: companyName.trim(),
        customerTrn: trn || undefined,
        formType: "VAT_RCM",
        formData: buildFormData(),
        signatureData: signatureData ?? undefined,
        stampData: stampData ?? undefined,
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
    } catch (e) {
      alert(e instanceof Error ? e.message : "PDF failed")
    }
  }

  return (
    <div className="space-y-6">
      {/* Declarant company */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><Building2 className="h-5 w-5" /> Declarant Company (From)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Declaration Date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Tax Registration Number (TRN) *</label>
            <input className={inputCls} value={trn} onChange={(e) => setTrn(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Company Name (as per Trade License) *</label>
            <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Business Address</label>
            <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} disabled={readonly} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>From — line 1 (company name as printed)</label>
            <input className={inputCls} value={from1} onChange={(e) => setFrom1(e.target.value)} disabled={readonly} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>From — line 2 (address as printed)</label>
            <input className={inputCls} value={from2} onChange={(e) => setFrom2(e.target.value)} disabled={readonly} />
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><FileText className="h-5 w-5" /> Declaration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Declarant Name *</label>
            <input className={inputCls} value={declarantName} onChange={(e) => setDeclarantName(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Emirates ID (EID #)</label>
            <input className={inputCls} value={eid} onChange={(e) => setEid(e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>On behalf of</label>
            <input className={inputCls} value={onBehalf} onChange={(e) => setOnBehalf(e.target.value)} placeholder={companyName || "Company"} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Liability rests upon (M/s)</label>
            <input className={inputCls} value={liableMs} onChange={(e) => setLiableMs(e.target.value)} placeholder={companyName || "Company"} disabled={readonly} />
          </div>
        </div>

        <div className="mt-5">
          <label className={labelCls}>Purpose of purchase</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm text-[#f3f4f6]">
              <input type="radio" name="purpose" className={radioCls} checked={purpose === "RESALE"} onChange={() => setPurpose("RESALE")} disabled={readonly} />
              The resale of said Electronic Devices
            </label>
            <label className="flex items-center gap-3 text-sm text-[#f3f4f6]">
              <input type="radio" name="purpose" className={radioCls} checked={purpose === "PRODUCE"} onChange={() => setPurpose("PRODUCE")} disabled={readonly} />
              Utilization in the production or manufacturing of Electronic Devices
            </label>
          </div>
        </div>

        <div className="mt-5">
          <label className={labelCls}>Signatory authority vested by</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm text-[#f3f4f6]">
              <input type="radio" name="authority" className={radioCls} checked={authority === "SIGNATORY"} onChange={() => setAuthority("SIGNATORY")} disabled={readonly} />
              Authorized signatory / Manager (as per trade license / MOA)
            </label>
            <label className="flex items-center gap-3 text-sm text-[#f3f4f6]">
              <input type="radio" name="authority" className={radioCls} checked={authority === "POA"} onChange={() => setAuthority("POA")} disabled={readonly} />
              Power of attorney
            </label>
          </div>
        </div>
      </div>

      {/* Signature & Stamp */}
      <div className={sectionCls}>
        <h2 className={h2Cls}><PenTool className="h-5 w-5" /> Signature & Company Seal</h2>
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
            <label className={labelCls}>Company Seal (upload image)</label>
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
                    <Stamp className="h-4 w-4" /> Choose seal image
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
                <label className={labelCls}>Designation</label>
                <input className={inputCls} value={designation} onChange={(e) => setDesignation(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <label className={labelCls}>Contact No</label>
                <input className={inputCls} value={contactNo} onChange={(e) => setContactNo(e.target.value)} disabled={readonly} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => save(false)} disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#21222d] text-[#f3f4f6] hover:bg-[#2a2b38] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
        </button>
        <button onClick={previewPdf} disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#21222d] text-[#f3f4f6] hover:bg-[#2a2b38] disabled:opacity-50">
          <Eye className="h-4 w-4" /> Preview PDF
        </button>
        {!readonly && (
          <button onClick={async () => { const a = await save(true); if (a) window.location.href = `/vat-rcm/${a.id}` }} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:opacity-50">
            <Send className="h-4 w-4" /> Submit
          </button>
        )}
      </div>
    </div>
  )
}
