"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { MenuIcon, XIcon, ZapIcon, UserIcon, LayoutDashboardIcon, LogOutIcon } from "lucide-react"
import ARZLogo from "@/components/ARZLogo"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type NavLink = { href: string; label: string; anchor?: boolean }

const links: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/#experience", label: "Experience", anchor: true },
  { href: "/#book", label: "Book Now", anchor: true },
  { href: "/bookings", label: "My Bookings" },
  { href: "/#contact", label: "Contact", anchor: true },
]

const ANCHOR_SECTIONS = ["experience", "book", "contact"]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push("/")
  }

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null)
      return
    }

    function onScroll() {
      // Near the bottom of the page → last section is always active
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 60
      if (nearBottom) {
        setActiveSection(ANCHOR_SECTIONS[ANCHOR_SECTIONS.length - 1])
        return
      }

      let current: string | null = null
      for (const id of ANCHOR_SECTIONS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 80) {
          current = id
        }
      }
      setActiveSection(current)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [pathname])

  function isActive(link: NavLink) {
    if (pathname !== "/") {
      return link.href === pathname
    }
    if (link.anchor) {
      return activeSection === link.href.replace("/#", "")
    }
    // Home is active only when no section has been scrolled into
    return link.href === "/" && activeSection === null
  }

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, link: NavLink) {
    if (!link.anchor) return
    if (pathname === "/") {
      e.preventDefault()
      const id = link.href.replace("/#", "")
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }
    setOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={() => setOpen(false)}
        >
          <ARZLogo
            className="font-heading text-2xl tracking-widest text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          />
          <ZapIcon className="size-4 text-vrz-green opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = isActive(link)
            const isBook = link.href === "/#book"
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link)}
                  className={[
                    "relative px-4 py-2 text-sm font-medium transition-colors rounded-md",
                    isBook
                      ? "ml-2 bg-vrz-green text-black hover:bg-vrz-green/90 rounded-md px-5"
                      : active
                      ? "text-vrz-green"
                      : "text-zinc-400 hover:text-white",
                  ].join(" ")}
                >
                  {link.label}
                  {!isBook && active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-vrz-green rounded-full shadow-[0_0_6px_#00FF7F]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User icon (desktop) */}
        <div className="hidden md:block relative" ref={userMenuRef}>
          {user ? (
            <>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-vrz-green hover:bg-vrz-green/10 transition-colors"
                aria-label="Account menu"
              >
                <UserIcon className="size-4" />
                <span className="text-xs font-medium max-w-[120px] truncate">{user.email?.split("@")[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-zinc-950 shadow-xl py-1 z-50">
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboardIcon className="size-4 text-vrz-green" />
                    Admin Dashboard
                  </Link>
                  <div className="h-px bg-white/8 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOutIcon className="size-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/admin/login"
              className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors rounded-md"
              aria-label="Admin login"
            >
              <UserIcon className="size-4" />
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-black/95 px-4 pb-4">
          <ul className="flex flex-col gap-1 pt-2">
            {links.map((link) => {
              const active = isActive(link)
              const isBook = link.href === "/#book"
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link)}
                    className={[
                      "block px-4 py-3 text-sm font-medium rounded-md transition-colors",
                      isBook
                        ? "bg-vrz-green text-black text-center mt-2"
                        : active
                        ? "text-vrz-green bg-vrz-green/5"
                        : "text-zinc-400 hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          {/* Mobile account section */}
          <div className="mt-3 pt-3 border-t border-white/5">
            {user ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-vrz-green bg-vrz-green/5 rounded-md"
                >
                  <LayoutDashboardIcon className="size-4" />
                  Admin Dashboard
                </Link>
                <button
                  onClick={() => { setOpen(false); handleSignOut() }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-500 hover:text-white transition-colors rounded-md mt-1"
                >
                  <LogOutIcon className="size-4" />
                  Sign Out ({user.email?.split("@")[0]})
                </button>
              </>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-500 hover:text-white transition-colors rounded-md"
              >
                <UserIcon className="size-4" />
                Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
