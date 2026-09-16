"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Settings,
  Tag,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: FolderKanban },
  { name: "Promotional Offers", href: "/promotional-offers", icon: Tag },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#8b5cf6] text-white"
                : "text-[#9ca3af] hover:bg-[#21222d] hover:text-[#f3f4f6]"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="border-t border-[rgba(255,255,255,0.08)] p-3">
      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9ca3af] transition-colors hover:bg-[#21222d] hover:text-[#f3f4f6]">
        <LogOut className="h-5 w-5 shrink-0" />
        Logout
      </button>
    </div>
  )

  const brand = (
    <div className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#ec4899]" />
        <h1 className="text-lg font-bold text-[#f3f4f6]">Catalog Admin</h1>
      </div>
      <button
        onClick={() => setMobileOpen(false)}
        className="lg:hidden text-[#9ca3af] hover:text-[#f3f4f6]"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#171821] border border-[rgba(255,255,255,0.08)] text-[#f3f4f6]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="flex h-full w-64 flex-col bg-[#0f1015] border-r border-[rgba(255,255,255,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            {brand}
            {navContent}
            {footer}
          </div>
        </div>
      )}

      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex h-full w-64 shrink-0 flex-col bg-[#0f1015] border-r border-[rgba(255,255,255,0.08)]">
        {brand}
        {navContent}
        {footer}
      </aside>
    </>
  )
}
