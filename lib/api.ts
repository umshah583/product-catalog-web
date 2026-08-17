const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Product {
  id: string
  name: string
  sku: string
  brand: string
  categoryId: string
  categoryName: string
  description: string
  price: number
  discountPrice: number | null
  currency: string
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  images: string[]
  specifications: Record<string, string>
  featured: boolean
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  imageUrl: string | null
  description: string
  sortOrder: number
  createdAt: string
}

interface Settings {
  companyName: string
  catalogTitle: string
  whatsappNumber: string
  phoneNumber: string
  contactEmail: string
  currency: string
  currencySymbol: string
  address: string
  workingHours: string
  aboutCompany: string
  whatsappEnabled: boolean
}

interface PromotionalOffer {
  id: string
  name: string
  description: string | null
  offerType: 'BUY_X_GET_Y_FREE' | 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT'
  buyQuantity: number | null
  getQuantity: number | null
  discountPercent: number | null
  discountAmount: string | null
  applicableTo: 'ALL_PRODUCTS' | 'SPECIFIC_CATEGORIES' | 'SPECIFIC_PRODUCTS'
  categoryIds: string[]
  productIds: string[]
  startDate: string
  endDate: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

// For now, we'll use a default tenant slug. In production, this should come from authentication
const DEFAULT_TENANT_ID = 'default'

class ApiClient {
  private baseUrl: string
  private tenantId: string

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl
    this.tenantId = tenantId
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-slug': this.tenantId,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products')
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`)
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories')
  }

  async getCategory(id: string): Promise<Category> {
    return this.request<Category>(`/categories/${id}`)
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/settings')
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    return this.request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Promotional Offers
  async getPromotionalOffers(): Promise<PromotionalOffer[]> {
    return this.request<PromotionalOffer[]>('/promotional-offers')
  }

  async getActivePromotionalOffers(): Promise<PromotionalOffer[]> {
    return this.request<PromotionalOffer[]>('/promotional-offers/active')
  }

  async getPromotionalOffer(id: string): Promise<PromotionalOffer> {
    return this.request<PromotionalOffer>(`/promotional-offers/${id}`)
  }

  async createPromotionalOffer(data: Partial<PromotionalOffer>): Promise<PromotionalOffer> {
    return this.request<PromotionalOffer>('/promotional-offers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePromotionalOffer(id: string, data: Partial<PromotionalOffer>): Promise<PromotionalOffer> {
    return this.request<PromotionalOffer>(`/promotional-offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePromotionalOffer(id: string): Promise<void> {
    return this.request<void>(`/promotional-offers/${id}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient(API_BASE_URL, DEFAULT_TENANT_ID)
export type { Product, Category, Settings, PromotionalOffer }
