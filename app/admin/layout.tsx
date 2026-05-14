"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboardIcon,
  CalendarIcon,
  TrendingUpIcon,
  ReceiptIcon,
  WalletIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin",             label: "Overview",     icon: LayoutDashboardIcon },
  { href: "/admin/reservations",label: "Reservations", icon: CalendarIcon },
  { href: "/admin/financials",  label: "P&L",          icon: TrendingUpIcon },
  { href: "/admin/expenses",    label: "Expenses",     icon: ReceiptIcon },
  { href: "/admin/receivables", label: "Receivables",  icon: WalletIcon },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === "/admin/login") return <>{children}</>

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-black border-r border-white/8">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/8">
        <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <span className="font-heading text-2xl tracking-widest text-white" style={{ fontFamily: "var(--font-heading)" }}>VRZ</span>
          <ZapIcon className="size-3.5 text-vrz-green" />
        </Link>
        <p className="text-xs text-zinc-600 mt-0.5 uppercase tracking-widest">Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-vrz-green/10 text-vrz-green border border-vrz-green/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOutIcon className="size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-black flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-56 shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-4 border-b border-white/8">
          <button onClick={() => setSidebarOpen(true)} className="text-zinc-400">
            <MenuIcon className="size-5" />
          </button>
          <span className="font-heading text-xl tracking-widest text-white" style={{ fontFamily: "var(--font-heading)" }}>VRZ</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-zinc-400">
              <XIcon className="size-5" />
            </button>
          )}
        </div>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
