import type { Product, Category, Settings } from "./api"

/**
 * Build a WhatsApp-formatted price list from the catalog data.
 * Uses WhatsApp's lightweight markdown: *bold*, _italic_, and line breaks.
 */
export function buildPriceListText(
  products: Product[],
  categories: Category[],
  settings: Settings | null,
): string {
  const companyName = settings?.companyName || "Our Store"
  const catalogTitle = settings?.catalogTitle || "Price List"
  const currencySymbol = settings?.currencySymbol || "$"
  const whatsappNumber = settings?.whatsappNumber || ""
  const phone = settings?.phoneNumber || ""
  const workingHours = settings?.workingHours || ""

  const lines: string[] = []
  lines.push(`*${companyName}*`)
  lines.push(`*${catalogTitle}*`)
  lines.push("")
  lines.push(`${products.length} products available`)
  lines.push("")

  // Group products by category, preserving category sort order
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
  const categoryMap = new Map<string, Product[]>()
  for (const cat of sortedCategories) {
    categoryMap.set(cat.id, [])
  }
  const uncategorized: Product[] = []
  for (const p of products) {
    if (categoryMap.has(p.categoryId)) {
      categoryMap.get(p.categoryId)!.push(p)
    } else {
      uncategorized.push(p)
    }
  }

  // Split a category's products into brand groups, alphabetically sorted,
  // with unbranded products last
  const groupByBrand = (items: Product[]): [string, Product[]][] => {
    const map = new Map<string, Product[]>()
    for (const p of items) {
      const brand = (p.brand || "").trim()
      if (!map.has(brand)) map.set(brand, [])
      map.get(brand)!.push(p)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "") return 1
      if (b === "") return -1
      return a.localeCompare(b)
    })
  }

  const formatLine = (p: Product): string => {
    const priceStr = `${currencySymbol}${Number(p.price).toFixed(2)}`
    const discount = p.discountPrice != null ? ` _now ${currencySymbol}${Number(p.discountPrice).toFixed(2)}_` : ""
    const stock =
      p.stockStatus === "OUT_OF_STOCK"
        ? " - _out of stock_"
        : p.stockStatus === "LOW_STOCK"
          ? " - _low stock_"
          : ""
    return `${p.name} - ${priceStr}${discount}${stock}`
  }

  let index = 1
  const appendItems = (items: Product[]) => {
    const brandGroups = groupByBrand(items)
    const hasBrands = brandGroups.some(([brand]) => brand !== "")
    for (const [brand, brandItems] of brandGroups) {
      if (hasBrands) lines.push(brand ? `*${brand}*` : "*Other*")
      for (const p of brandItems) {
        lines.push(`${index}. ${formatLine(p)}`)
        index++
      }
      if (hasBrands) lines.push("")
    }
  }

  for (const cat of sortedCategories) {
    const items = categoryMap.get(cat.id) || []
    if (items.length === 0) continue
    lines.push(`*${cat.name}*`)
    appendItems(items)
    lines.push("")
  }

  if (uncategorized.length > 0) {
    lines.push("*Uncategorized*")
    appendItems(uncategorized)
    lines.push("")
  }

  lines.push("────────────────")
  if (whatsappNumber) lines.push(`WhatsApp: ${whatsappNumber}`)
  if (phone) lines.push(`Phone: ${phone}`)
  if (workingHours) lines.push(`Hours: ${workingHours}`)
  lines.push("")
  lines.push("_Prices subject to change. Contact us to order._")

  return lines.join("\n")
}

/**
 * Trigger a browser download of the price list as a .txt file.
 */
export function downloadPriceList(
  products: Product[],
  categories: Category[],
  settings: Settings | null,
): void {
  const text = buildPriceListText(products, categories, settings)
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const companyName = (settings?.companyName || "store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `price-list-${companyName || "store"}-${date}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
