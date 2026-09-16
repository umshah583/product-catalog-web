"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Package, FolderKanban, TrendingUp, DollarSign, Loader2, Download } from "lucide-react"
import { useEffect, useState } from "react"
import { api, type Product, type Category, type Settings } from "@/lib/api"
import { downloadPriceList } from "@/lib/price-list"

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [productsData, categoriesData, settingsData] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getSettings(),
        ])
        setProducts(productsData)
        setCategories(categoriesData)
        setSettings(settingsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const currencySymbol = settings?.currencySymbol || '$'

  const stats = [
    { name: "Total Products", value: products.length.toString(), icon: Package, color: "bg-[#8b5cf6]" },
    { name: "Categories", value: categories.length.toString(), icon: FolderKanban, color: "bg-[#10b981]" },
    { name: "Total Sales", value: `${currencySymbol}0`, icon: DollarSign, color: "bg-[#f59e0b]" },
    { name: "Growth", value: "0%", icon: TrendingUp, color: "bg-[#ef4444]" },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#8b5cf6] animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(239,68,68,0.3)]">
            <p className="text-[#ef4444]">Error: {error}</p>
            <p className="text-sm text-[#9ca3af] mt-2">Make sure the backend is running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#f3f4f6]">Dashboard</h1>
          <button
            onClick={() => downloadPriceList(products, categories, settings)}
            disabled={products.length === 0}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            title="Download full price list as a WhatsApp-formatted text file"
          >
            <Download className="h-5 w-5" />
            Price List
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#9ca3af]">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-[#f3f4f6]">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
          <h2 className="text-xl font-bold text-[#f3f4f6] mb-4">Recent Products</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <p>No products found</p>
              <p className="text-sm mt-2">Add your first product to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-[#21222d] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#f3f4f6]">{product.name}</p>
                    <p className="text-sm text-[#9ca3af]">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#f3f4f6]">{currencySymbol}{Number(product.price).toFixed(2)}</p>
                    <p className="text-sm text-[#9ca3af]">{product.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
