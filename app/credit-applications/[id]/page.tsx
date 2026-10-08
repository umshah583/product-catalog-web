"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CreditApplicationForm } from "@/components/credit-application-form"
import { api, type CreditApplication } from "@/lib/api"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Loader2, Eye, X, CheckCircle2, XCircle, FileText, History, Send, RotateCcw } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#9ca3af]/20 text-[#9ca3af]",
  SUBMITTED: "bg-[#3b82f6]/20 text-[#3b82f6]",
  UNDER_REVIEW: "bg-[#f59e0b]/20 text-[#f59e0b]",
  APPROVED: "bg-[#10b981]/20 text-[#10b981]",
  REJECTED: "bg-[#ef4444]/20 text-[#ef4444]",
}

export default function CreditApplicationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [app, setApp] = useState<CreditApplication | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const pdfUrlRef = useRef<string | null>(null)

  const load = () => {
    api.getCreditApplication(id).then(setApp).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
    }
  }, [id])

  const showPdf = async () => {
    setPdfLoading(true)
    try {
      const blob = await api.fetchCreditAppPdf(id)
      const url = URL.createObjectURL(blob)
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
      pdfUrlRef.current = url
      setPdfUrl(url)
    } catch {
      alert("Failed to generate PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const blob = await api.fetchCreditAppPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `credit-application-${app?.appNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Failed to generate PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  const doStatus = async (status: string) => {
    setActionLoading(true)
    try {
      const updated = await api.updateCreditAppStatus(id, status, reviewNotes || undefined)
      setApp(updated)
      setReviewNotes("")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">
              {app ? app.appNumber : "Credit Application"}
            </h1>
            {app && (
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                  {app.status.replace("_", " ")}
                </span>
                <span className="text-sm text-[#9ca3af]">{app.customerName}</span>
              </div>
            )}
          </div>
          {app && (
            <div className="flex flex-wrap gap-2">
              <button onClick={showPdf} disabled={pdfLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#8b5cf6]/30 disabled:opacity-50">
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview PDF
              </button>
              <button onClick={downloadPdf} disabled={pdfLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm hover:bg-[#7c3aed] disabled:opacity-50">
                <FileText className="h-4 w-4" /> Download PDF
              </button>
            </div>
          )}
        </div>

        {error ? (
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]">
            <p className="text-[#ef4444]">Error: {error}</p>
          </div>
        ) : !app ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" />
          </div>
        ) : (
          <>
            {/* PDF preview modal */}
            {pdfUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[#171821] rounded-xl w-full max-w-5xl h-[90vh] flex flex-col border border-[rgba(255,255,255,0.1)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                    <h3 className="text-sm font-semibold text-[#f3f4f6]">Credit Application PDF — {app.appNumber}</h3>
                    <button onClick={() => setPdfUrl(null)} className="text-[#9ca3af] hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                  <iframe src={pdfUrl} className="flex-1 w-full rounded-b-xl" title="PDF Preview" />
                </div>
              </div>
            )}

            {/* Review actions */}
            {app.status !== "DRAFT" && (
              <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)] mb-6">
                <h2 className="text-lg font-bold text-[#f3f4f6] mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" /> Credit Control Review
                </h2>
                <div className="flex flex-col gap-4">
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Internal review notes (not shared with customer)..."
                    rows={2}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {app.status === "SUBMITTED" && (
                      <button onClick={() => doStatus("UNDER_REVIEW")} disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f59e0b] text-white text-sm hover:bg-[#d97706] disabled:opacity-50">
                        <Eye className="h-4 w-4" /> Start Review
                      </button>
                    )}
                    {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") && (
                      <>
                        <button onClick={() => doStatus("APPROVED")} disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10b981] text-white text-sm hover:bg-[#0da271] disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => doStatus("REJECTED")} disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm hover:bg-[#dc2626] disabled:opacity-50">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}
                    {app.status === "REJECTED" && (
                      <button onClick={() => doStatus("DRAFT")} disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21222d] text-[#f3f4f6] text-sm hover:bg-[#2a2b38] disabled:opacity-50">
                        <RotateCcw className="h-4 w-4" /> Return to Draft
                      </button>
                    )}
                  </div>
                  {app.internalNotes && (
                    <div className="text-xs text-[#9ca3af] bg-[#21222d]/60 rounded-lg px-3 py-2">
                      <span className="font-semibold text-[#f3f4f6]">Last internal note:</span> {app.internalNotes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audit trail */}
            {app.audits?.length > 0 && (
              <details className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] mb-6">
                <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-[#f3f4f6] flex items-center gap-2">
                  <History className="h-4 w-4" /> Audit Trail ({app.audits.length})
                </summary>
                <div className="px-6 pb-4 space-y-1.5">
                  {app.audits.map((a) => (
                    <div key={a.id} className="text-xs text-[#9ca3af] flex gap-3">
                      <span className="shrink-0 w-36">{new Date(a.createdAt).toLocaleString()}</span>
                      <span className="text-[#8b5cf6] font-medium w-32 shrink-0">{a.action}</span>
                      <span>{a.detail}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Editable form (read-only when approved) */}
            <CreditApplicationForm key={app.id} existing={app} />
          </>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
