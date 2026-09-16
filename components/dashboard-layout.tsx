import { Sidebar } from "./sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0f1015]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
