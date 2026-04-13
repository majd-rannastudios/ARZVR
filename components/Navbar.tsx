"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { MenuIcon, XIcon, ZapIcon } from "lucide-react"
import ARZLogo from "@/components/ARZLogo"

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
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

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
        </div>
      )}
    </header>
  )
}
