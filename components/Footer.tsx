import Link from "next/link"
import { MapPinIcon, ClockIcon, MessageCircleIcon, MailIcon } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/80 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span
              className="font-heading text-3xl tracking-widest text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              VRZ
            </span>
            <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
              The virtual inversion of reality. Enter the hunt.
            </p>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Location
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPinIcon className="size-4 shrink-0 text-vrz-green mt-0.5" />
                <span>Byblos (Jbeil), Lebanon</span>
              </li>
              <li className="flex items-start gap-2">
                <ClockIcon className="size-4 shrink-0 text-vrz-green mt-0.5" />
                <span>3:00 PM – 11:00 PM daily</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Navigate
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/", label: "Home" },
                { href: "/experience", label: "Experience" },
                { href: "/book", label: "Book a Session" },
                { href: "/bookings", label: "My Bookings" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-zinc-400 hover:text-vrz-green transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Reach Us
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li>
                <a
                  href="https://wa.me/96170000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-vrz-green transition-colors"
                >
                  <MessageCircleIcon className="size-4 text-vrz-green" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:bookings@vrz.lb"
                  className="flex items-center gap-2 hover:text-vrz-green transition-colors"
                >
                  <MailIcon className="size-4 text-vrz-green" />
                  bookings@vrz.lb
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} VRZ. All rights reserved.</p>
          <p>Byblos, Lebanon — Open daily 3 PM – 11 PM</p>
        </div>
      </div>
    </footer>
  )
}
