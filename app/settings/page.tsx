"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Building2, Phone, Mail, MapPin, Clock, Save, Loader2, Image } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type Settings } from "@/lib/api"
import { useRealtimeSync } from "@/lib/use-realtime-sync"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    catalogTitle: "",
    whatsappNumber: "",
    phoneNumber: "",
    contactEmail: "",
    currency: "USD",
    currencySymbol: "$",
    address: "",
    workingHours: "",
    aboutCompany: "",
    whatsappEnabled: false,
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImageUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.getSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSettings()
  }, [fetchSettings])

  useRealtimeSync({
    onSettingsChanged: () => { api.getSettings().then(setSettings).catch(() => {}) },
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateSettings(settings)
      alert("Settings saved successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="">
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]">
            <p className="text-[#ef4444]">Error: {error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute>
    <DashboardLayout>
      <div className="">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6] mb-6 sm:mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Catalog Title</label>
                <input
                  type="text"
                  value={settings.catalogTitle}
                  onChange={(e) => setSettings({ ...settings, catalogTitle: e.target.value })}
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Phone Number</label>
                <input
                  type="text"
                  value={settings.phoneNumber}
                  onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>
          </div>

          {/* Location & Hours */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Hours
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Address</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Enter your business address"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Working Hours</label>
                <input
                  type="text"
                  value={settings.workingHours}
                  onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                  placeholder="Mon-Fri: 9AM-6PM"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>
          </div>

          {/* About Company */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              About Company
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
              <textarea
                rows={4}
                value={settings.aboutCompany}
                onChange={(e) => setSettings({ ...settings, aboutCompany: e.target.value })}
                placeholder="Tell customers about your company"
                className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
          </div>

          {/* Home Banner */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Home Banner
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Banner Title</label>
                <input
                  type="text"
                  value={settings.bannerTitle ?? ""}
                  onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
                  placeholder="Explore Latest Tech & Catalog"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Banner Subtitle</label>
                <input
                  type="text"
                  value={settings.bannerSubtitle ?? ""}
                  onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
                  placeholder="Discover our latest products"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Banner Image URL</label>
                <input
                  type="text"
                  value={settings.bannerImageUrl ?? ""}
                  onChange={(e) => setSettings({ ...settings, bannerImageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg (optional)"
                  className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                />
                <p className="text-xs text-[#9ca3af] mt-1">Optional background image for the banner. Google Drive links are supported.</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-6 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              WhatsApp Integration
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#f3f4f6] font-medium">Enable WhatsApp</p>
                <p className="text-sm text-[#9ca3af]">Allow customers to contact via WhatsApp</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, whatsappEnabled: !settings.whatsappEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.whatsappEnabled ? "bg-[#8b5cf6]" : "bg-[#21222d]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.whatsappEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#4a4850] text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
