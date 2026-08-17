"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  FolderKanban, 
  Settings,
  Tag,
  LogOut
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

  return (
    <div className="flex h-full w-64 flex-col bg-[#0f1015] border-r border-[rgba(255,255,255,0.08)]">
      <div className="flex h-16 items-center border-b border-[rgba(255,255,255,0.08)] px-6">
        <h1 className="text-xl font-bold text-[#f3f4f6]">Catalog Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#8b5cf6] text-white"
                  : "text-[#9ca3af] hover:bg-[#21222d] hover:text-[#f3f4f6]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-[rgba(255,255,255,0.08)] p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9ca3af] transition-colors hover:bg-[#21222d] hover:text-[#f3f4f6]">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
