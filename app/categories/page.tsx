"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Plus, Search, Edit, Trash2, Folder, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api, type Category, type Product } from "@/lib/api"

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [categoriesData, productsData] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ])
        setCategories(categoriesData)
        setProducts(productsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load categories")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getCategoryProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setShowEditModal(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return

    try {
      await api.deleteCategory(selectedCategory.id)
      setCategories(categories.filter(c => c.id !== selectedCategory.id))
      setShowDeleteModal(false)
      setSelectedCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCategory) return

    try {
      const formData = new FormData(e.currentTarget)
      const updatedCategory = {
        ...selectedCategory,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        sortOrder: Number(formData.get('sortOrder')),
      }

      await api.updateCategory(selectedCategory.id, updatedCategory)
      setCategories(categories.map(c => c.id === selectedCategory.id ? updatedCategory : c))
      setShowEditModal(false)
      setSelectedCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category")
    }
  }

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
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#f3f4f6]">Categories</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171821] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2 text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-[#171821] rounded-xl p-6 border border-[rgba(255,255,255,0.08)] hover:border-[#8b5cf6] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[#8b5cf6] rounded-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-[#21222d] rounded-lg transition-colors text-[#9ca3af] hover:text-[#f3f4f6]"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(category)}
                    className="p-2 hover:bg-[#21222d] rounded-lg transition-colors text-[#9ca3af] hover:text-[#ef4444]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#f3f4f6] mb-2">{category.name}</h3>
              <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">{category.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9ca3af]">{getCategoryProductCount(category.id)} products</span>
                <span className="text-[#f3f4f6]">Order: {category.sortOrder}</span>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#9ca3af]">
              No categories found
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#171821] rounded-xl p-6 w-full max-w-md border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-6">Add New Category</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Category Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter category description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Sort Order</label>
                  <input
                    type="number"
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                >
                  Cancel
                </button>
                <button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors">
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#171821] rounded-xl p-6 w-full max-w-md border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-6">Edit Category</h2>
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Category Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedCategory.name}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={selectedCategory.description || ''}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Enter category description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Sort Order</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={selectedCategory.sortOrder}
                    className="w-full bg-[#21222d] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-[#f3f4f6] focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="0"
                  />
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
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#171821] rounded-xl p-6 w-full max-w-md border border-[rgba(255,255,255,0.08)]">
              <h2 className="text-2xl font-bold text-[#f3f4f6] mb-4">Delete Category</h2>
              <p className="text-[#9ca3af] mb-6">
                Are you sure you want to delete "{selectedCategory.name}"? This action cannot be undone.
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
