"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Plus, Search, Edit, Trash2, Tag, Loader2, Calendar, Percent, Gift } from "lucide-react"
import { useEffect, useState } from "react"
import { api, type PromotionalOffer, type Category, type Product } from "@/lib/api"

export default function PromotionalOffersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<PromotionalOffer | null>(null)
  const [offers, setOffers] = useState<PromotionalOffer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [offersData, categoriesData, productsData] = await Promise.all([
          api.getPromotionalOffers(),
          api.getCategories(),
          api.getProducts(),
        ])
        setOffers(offersData)
        setCategories(categoriesData)
        setProducts(productsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load promotional offers")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredOffers = offers.filter((offer) =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (offer: PromotionalOffer) => {
    setSelectedOffer(offer)
    setShowEditModal(true)
  }

  const handleDelete = (offer: PromotionalOffer) => {
    setSelectedOffer(offer)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedOffer) return

    try {
      setSaving(true)
      await api.deletePromotionalOffer(selectedOffer.id)
      setOffers(offers.filter(o => o.id !== selectedOffer.id))
      setShowDeleteModal(false)
      setSelectedOffer(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete promotional offer")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      setSaving(true)
      // Convert date strings to ISO-8601 format
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      }
      if (selectedOffer) {
        const updated = await api.updatePromotionalOffer(selectedOffer.id, formattedData)
        setOffers(offers.map(o => o.id === selectedOffer.id ? updated : o))
        setShowEditModal(false)
      } else {
        const created = await api.createPromotionalOffer(formattedData)
        setOffers([...offers, created])
        setShowAddModal(false)
      }
      setSelectedOffer(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save promotional offer")
    } finally {
      setSaving(false)
    }
  }

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY_X_GET_Y_FREE':
        return <Gift className="w-4 h-4" />
      case 'PERCENTAGE_DISCOUNT':
        return <Percent className="w-4 h-4" />
      case 'FLAT_DISCOUNT':
        return <Tag className="w-4 h-4" />
      default:
        return <Tag className="w-4 h-4" />
    }
  }

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'BUY_X_GET_Y_FREE':
        return 'Buy X Get Y Free'
      case 'PERCENTAGE_DISCOUNT':
        return 'Percentage Discount'
      case 'FLAT_DISCOUNT':
        return 'Flat Discount'
      default:
        return type
    }
  }

  const getOfferDescription = (offer: PromotionalOffer) => {
    switch (offer.offerType) {
      case 'BUY_X_GET_Y_FREE':
        return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`
      case 'PERCENTAGE_DISCOUNT':
        return `${offer.discountPercent}% Off`
      case 'FLAT_DISCOUNT':
        return `${offer.discountAmount} Off`
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOfferActive = (offer: PromotionalOffer) => {
    const now = new Date()
    const start = new Date(offer.startDate)
    const end = new Date(offer.endDate)
    return offer.isActive && now >= start && now <= end
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#8b5cf6]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f3f4f6]">Promotional Offers</h1>
            <p className="text-[#9ca3af] mt-1">Manage your promotional offers and discounts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Offer
          </button>
        </div>

        {error && (
          <div className="p-4 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] rounded-lg text-[#ef4444]">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="bg-[#171821] rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left p-4 text-[#9ca3af] font-medium">Offer</th>
                <th className="text-left p-4 text-[#9ca3af] font-medium">Type</th>
                <th className="text-left p-4 text-[#9ca3af] font-medium">Value</th>
                <th className="text-left p-4 text-[#9ca3af] font-medium">Valid Period</th>
                <th className="text-left p-4 text-[#9ca3af] font-medium">Status</th>
                <th className="text-left p-4 text-[#9ca3af] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#9ca3af]">
                    No promotional offers found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center text-[#8b5cf6]">
                          {getOfferTypeIcon(offer.offerType)}
                        </div>
                        <div>
                          <p className="font-medium text-[#f3f4f6]">{offer.name}</p>
                          {offer.description && (
                            <p className="text-sm text-[#9ca3af]">{offer.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#f3f4f6]">{getOfferTypeLabel(offer.offerType)}</td>
                    <td className="p-4 text-[#f3f4f6] font-medium">{getOfferDescription(offer)}</td>
                    <td className="p-4 text-[#9ca3af]">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(offer.startDate)} - {formatDate(offer.endDate)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isOfferActive(offer)
                          ? 'bg-[rgba(16,185,129,0.15)] text-[#10b981]'
                          : 'bg-[rgba(156,163,175,0.15)] text-[#9ca3af]'
                      }`}>
                        {isOfferActive(offer) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="p-2 hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors text-[#9ca3af] hover:text-[#f3f4f6]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(offer)}
                          className="p-2 hover:bg-[rgba(239,68,68,0.15)] rounded-lg transition-colors text-[#9ca3af] hover:text-[#ef4444]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <OfferModal
          categories={categories}
          products={products}
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          categories={categories}
          products={products}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOffer(null)
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171821] rounded-lg p-6 w-full max-w-md border border-[rgba(255,255,255,0.08)]">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-4">Delete Promotional Offer</h2>
            <p className="text-[#9ca3af] mb-6">
              Are you sure you want to delete "{selectedOffer.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedOffer(null)
                }}
                className="px-4 py-2 bg-[#21222d] hover:bg-[#2a2b38] text-[#f3f4f6] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="px-4 py-2 bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#ef4444] rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function OfferModal({ offer, categories, products, onClose, onSave, saving }: any) {
  console.log('OfferModal received products:', products.length, products);
  const [formData, setFormData] = useState(
    offer || {
      name: '',
      description: '',
      offerType: 'PERCENTAGE_DISCOUNT',
      buyQuantity: 2,
      getQuantity: 1,
      discountPercent: 10,
      discountAmount: '10',
      applicableTo: 'ALL_PRODUCTS',
      categoryIds: [],
      productIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      priority: 0,
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-[#171821] rounded-lg p-6 w-full max-w-2xl border border-[rgba(255,255,255,0.08)] my-8">
        <h2 className="text-xl font-bold text-[#f3f4f6] mb-6">
          {offer ? 'Edit Promotional Offer' : 'Add Promotional Offer'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Offer Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6] resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Offer Type</label>
            <select
              value={formData.offerType}
              onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
              className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value="BUY_X_GET_Y_FREE">Buy X Get Y Free</option>
              <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
              <option value="FLAT_DISCOUNT">Flat Discount</option>
            </select>
          </div>

          {formData.offerType === 'BUY_X_GET_Y_FREE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Buy Quantity</label>
                <input
                  type="number"
                  value={formData.buyQuantity}
                  onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Get Quantity Free</label>
                <input
                  type="number"
                  value={formData.getQuantity}
                  onChange={(e) => setFormData({ ...formData, getQuantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                  required
                />
              </div>
            </div>
          )}

          {formData.offerType === 'PERCENTAGE_DISCOUNT' && (
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Discount Percentage</label>
              <input
                type="number"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                required
              />
            </div>
          )}

          {formData.offerType === 'FLAT_DISCOUNT' && (
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Discount Amount</label>
              <input
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Applicable To</label>
            <select
              value={formData.applicableTo}
              onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
              className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value="ALL_PRODUCTS">All Products</option>
              <option value="SPECIFIC_CATEGORIES">Specific Categories</option>
              <option value="SPECIFIC_PRODUCTS">Specific Products</option>
            </select>
          </div>

          {formData.applicableTo === 'SPECIFIC_CATEGORIES' && (
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Select Categories</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-[rgba(255,255,255,0.08)] rounded-lg p-2 bg-[#21222d]">
                {categories.map((category: any) => (
                  <label key={category.id} className="flex items-center gap-2 p-2 hover:bg-[rgba(255,255,255,0.02)] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, categoryIds: [...formData.categoryIds, category.id] })
                        } else {
                          setFormData({ ...formData, categoryIds: formData.categoryIds.filter((id: string) => id !== category.id) })
                        }
                      }}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.08)] bg-[#21222d] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                    />
                    <span className="text-sm text-[#f3f4f6]">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.applicableTo === 'SPECIFIC_PRODUCTS' && (
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Select Products ({products.length} available)</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-[rgba(255,255,255,0.08)] rounded-lg p-2 bg-[#21222d]">
                {products.length === 0 ? (
                  <p className="text-sm text-[#9ca3af] p-2">No products available. Loading...</p>
                ) : (
                  products.map((product: any) => (
                    <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-[rgba(255,255,255,0.02)] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, productIds: [...formData.productIds, product.id] })
                          } else {
                            setFormData({ ...formData, productIds: formData.productIds.filter((id: string) => id !== product.id) })
                          }
                        }}
                        className="w-4 h-4 rounded border-[rgba(255,255,255,0.08)] bg-[#21222d] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                      />
                      <span className="text-sm text-[#f3f4f6]">{product.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">DEBUG: products array length = {products.length}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[rgba(255,255,255,0.08)] bg-[#21222d] text-[#8b5cf6] focus:ring-[#8b5cf6]"
            />
            <label htmlFor="isActive" className="text-sm text-[#9ca3af]">Active</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
            />
            <p className="text-xs text-[#9ca3af] mt-1">Higher priority offers are applied first</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#21222d] hover:bg-[#2a2b38] text-[#f3f4f6] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
