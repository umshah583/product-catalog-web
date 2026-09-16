"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ImageListEditor } from "@/components/image-list-editor"
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, Download } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type Product, type Settings, type Category } from "@/lib/api"
import { downloadPriceList } from "@/lib/price-list"
import { useRealtimeSync } from "@/lib/use-realtime-sync"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addImages, setAddImages] = useState<string[]>([])
  const [editImages, setEditImages] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [productsData, settingsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getSettings(),
        api.getCategories(),
      ])
      setProducts(productsData)
      setSettings(settingsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  useRealtimeSync({
    onProductsChanged: () => { api.getProducts().then(setProducts).catch(() => {}) },
    onCategoriesChanged: () => { api.getCategories().then(setCategories).catch(() => {}) },
    onSettingsChanged: () => { api.getSettings().then(setSettings).catch(() => {}) },
  })

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-[rgba(16,185,129,0.15)] text-[#10b981]"
      case "LOW_STOCK":
        return "bg-[rgba(245,158,11,0.15)] text-[#f59e0b]"
      case "OUT_OF_STOCK":
        return "bg-[rgba(239,68,68,0.15)] text-[#ef4444]"
      default:
        return "bg-[rgba(255,255,255,0.08)] text-[#9ca3af]"
    }
  }

  const currencySymbol = settings?.currencySymbol || '$'

  // Convert common share links (e.g. Google Drive) to a direct image URL
  const convertImageUrl = (url?: string | null) => {
    if (!url) return ''
    try {
      const u = url.trim()
      // Google Drive share links: https://drive.google.com/file/d/<id>/view?usp=sharing
      const driveFileMatch = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/)
      if (driveFileMatch && driveFileMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`
      }

      // Googleusercontent direct links or standard http(s) images: return as-is
      return u
    } catch (_) {
      return url || ''
    }
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditImages(product.images || [])
    setShowEditModal(true)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return

    try {
      await api.deleteProduct(selectedProduct.id)
      setProducts(products.filter(p => p.id !== selectedProduct.id))
      setShowDeleteModal(false)
      setSelectedProduct(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProduct) return

    try {
      const formData = new FormData(e.currentTarget)
      const categoryIdFromForm = formData.get('categoryId') as string | null
      let categoryId = selectedProduct.categoryId
      let categoryName = selectedProduct.categoryName
      if (categoryIdFromForm) {
        categoryId = categoryIdFromForm
        const found = categories.find(c => c.id === categoryIdFromForm)
        categoryName = found ? found.name : categoryName
      }
      const updatedProduct = {
        ...selectedProduct,
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        brand: formData.get('brand') as string,
        price: Number(formData.get('price')),
        stockStatus: formData.get('stockStatus') as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK',
        description: formData.get('description') as string,
        images: editImages,
        specifications: (() => {
          const txt = formData.get('specifications') as string | null
          if (!txt) return selectedProduct.specifications
          try {
            return JSON.parse(txt)
          } catch (_) {
            throw new Error('Invalid JSON in Specifications field')
          }
        })(),
        categoryId,
        categoryName,
      }

      await api.updateProduct(selectedProduct.id, updatedProduct)
      setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p))
      setShowEditModal(false)
      setSelectedProduct(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product")
    }
  }

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.currentTarget)
      const name = (formData.get('name') as string) || 'Untitled Product'
      const sku = (formData.get('sku') as string) || `${name.toLowerCase().replace(/\s+/g,'-')}-${Math.floor(Math.random()*9000)+1000}`
      const brand = (formData.get('brand') as string) || ''
      const price = Number(formData.get('price')) || 0
      const stockStatus = (formData.get('stockStatus') as any) || 'IN_STOCK'
      const description = (formData.get('description') as string) || ''
      const specifications = (() => {
        const txt = formData.get('specifications') as string | null
        if (!txt) return {}
        try {
          return JSON.parse(txt)
        } catch (_) {
          throw new Error('Invalid JSON in Specifications field')
        }
      })()

      // Category from form if present, else pick first existing or create default
      let categoryId = (formData.get('categoryId') as string) || ''
      let categoryName = ''

      if (categoryId) {
        const cat = categories.find(c => c.id === categoryId)
        categoryName = cat ? cat.name : ''
      } else {
        if (categories.length > 0) {
          categoryId = categories[0].id
          categoryName = categories[0].name
        } else {
          try {
            const createdCat = await api.createCategory({ name: 'Uncategorized', description: '' })
            categoryId = createdCat.id
            categoryName = createdCat.name
          } catch (err) {
            // leave empty to let backend validate
          }
        }
      }

      const payload: Partial<Product> = {
        name,
        sku,
        brand,
        price,
        stockStatus,
        description,
        images: addImages,
        specifications,
        categoryId,
        categoryName,
        currency: 'USD',
        discountPrice: null,
        featured: false,
        isActive: true,
      }

      const created = await api.createProduct(payload)
      setProducts([created, ...products])
      setShowAddModal(false)
      setAddImages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
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
    <DashboardLayout>
      <div className="">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f4f6]">Products</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => downloadPriceList(products, categories, settings)}
              disabled={products.length === 0}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              title="Download full price list as a WhatsApp-formatted text file"
            >
              <Download className="h-5 w-5" />
              Price List
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171821] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2 text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="bg-[#171821] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Product</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">SKU</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Brand</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Category</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Price</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Stock</th>
                <th className="text-left p-4 text-sm font-medium text-[#9ca3af]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[#21222d]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-[#21222d] rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          // Use the converted URL (handles Google Drive share links)
                          <img src={convertImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-[#9ca3af]" />
                        )}
                        {product.images && product.images.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-tl leading-tight">
                            +{product.images.length - 1}
                          </span>
                        )}
                      </div>
                      <span className="text-[#f3f4f6] font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#9ca3af]">{product.sku}</td>
                  <td className="p-4 text-[#f3f4f6]">{product.brand}</td>
                  <td className="p-4 text-[#9ca3af]">{product.categoryName}</td>
                  <td className="p-4 text-[#f3f4f6] font-medium">{currencySymbol}{Number(product.price).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockBadgeColor(product.stockStatus)}`}>
                      {product.stockStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-[#21222d] rounded-lg transition-colors text-[#9ca3af] hover:text-[#f3f4f6]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        className="p-2 hover:bg-[#21222d] rounded-lg transition-colors text-[#9ca3af] hover:text-[#ef4444]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#9ca3af]">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#171821] rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-6">Add New Product</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Product Name</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">SKU</label>
                    <input
                      name="sku"
                      type="text"
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Brand</label>
                    <input
                      name="brand"
                      type="text"
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="Enter brand"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Price</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Stock Status</label>
                    <select name="stockStatus" className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]">
                      <option value="IN_STOCK">In Stock</option>
                      <option value="LOW_STOCK">Low Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Category</label>
                  <select name="categoryId" className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]">
                    {categories.length === 0 && <option value="">Uncategorized</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter product description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Images</label>
                  <ImageListEditor
                    images={addImages}
                    onChange={setAddImages}
                    convertImageUrl={convertImageUrl}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Specifications (JSON)</label>
                  <textarea
                    name="specifications"
                    rows={4}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] font-mono text-sm"
                    placeholder='{"Size": "M", "Color": "Black"}'
                  />
                  <p className="text-xs text-[#9ca3af] mt-1">Enter specifications as JSON key-value pairs</p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#171821] rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-6">Edit Product</h2>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Product Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedProduct.name}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">SKU</label>
                    <input
                      name="sku"
                      type="text"
                      defaultValue={selectedProduct.sku}
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Brand</label>
                    <input
                      name="brand"
                      type="text"
                      defaultValue={selectedProduct.brand || ''}
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="Enter brand"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Price</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={Number(selectedProduct.price)}
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">Stock Status</label>
                    <select 
                      name="stockStatus"
                      defaultValue={selectedProduct.stockStatus}
                      className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="LOW_STOCK">Low Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Category</label>
                  <select name="categoryId" defaultValue={selectedProduct.categoryId} className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]">
                    {categories.length === 0 && <option value="">Uncategorized</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={selectedProduct.description || ''}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter product description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Images</label>
                  <ImageListEditor
                    images={editImages}
                    onChange={setEditImages}
                    convertImageUrl={convertImageUrl}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Specifications (JSON)</label>
                  <textarea
                    name="specifications"
                    rows={4}
                    defaultValue={JSON.stringify(selectedProduct.specifications || {}, null, 2)}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] font-mono text-sm"
                    placeholder='{"Size": "M", "Color": "Black"}'
                  />
                  <p className="text-xs text-[#9ca3af] mt-1">Enter specifications as JSON key-value pairs</p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors">
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#171821] rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-4">Delete Product</h2>
              <p className="text-[#9ca3af] mb-6">
                Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
