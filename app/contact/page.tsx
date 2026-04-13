import type { Metadata } from "next"
import { MapPinIcon, ClockIcon, MessageCircleIcon, MailIcon, PhoneIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with VRZ. Find us in Byblos (Jbeil), Lebanon. Open daily 3 PM – 11 PM. WhatsApp or email for bookings and inquiries.",
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">
          Get In Touch
        </span>
        <h1
          className="font-heading text-5xl sm:text-7xl text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Contact VRZ
        </h1>
        <p className="text-zinc-500 mt-4 max-w-md mx-auto">
          Questions, group bookings, or just want to know more? We&apos;re easy to reach.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* WhatsApp */}
        <a
          href="https://wa.me/96170000000"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-5 rounded-xl border border-white/10 bg-white/2 p-7 hover:border-vrz-green/40 hover:bg-vrz-green/5 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
            <MessageCircleIcon className="size-6 text-[#25D366]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-1">WhatsApp</h2>
            <p className="text-sm text-zinc-500 mb-3">
              Fastest way to reach us. Send a message and we&apos;ll get back to you quickly.
            </p>
            <span className="text-sm font-medium text-vrz-green group-hover:underline">
              +961 70 000 000
            </span>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:bookings@vrz.lb"
          className="group flex flex-col gap-5 rounded-xl border border-white/10 bg-white/2 p-7 hover:border-vrz-green/40 hover:bg-vrz-green/5 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
            <MailIcon className="size-6 text-vrz-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Email</h2>
            <p className="text-sm text-zinc-500 mb-3">
              For detailed inquiries, private event requests, or group bookings.
            </p>
            <span className="text-sm font-medium text-vrz-green group-hover:underline">
              bookings@vrz.lb
            </span>
          </div>
        </a>

        {/* Location */}
        <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/2 p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
            <MapPinIcon className="size-6 text-vrz-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Location</h2>
            <p className="text-sm text-zinc-500 mb-2">
              Byblos (Jbeil), North Lebanon
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Located in the heart of Byblos — one of the world&apos;s oldest cities.
              Street-level access, easy to find.
            </p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/2 p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
            <ClockIcon className="size-6 text-vrz-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Hours</h2>
            <div className="space-y-2">
              {[
                { day: "Monday – Friday", hours: "3:00 PM – 11:00 PM" },
                { day: "Saturday", hours: "3:00 PM – 11:00 PM" },
                { day: "Sunday", hours: "3:00 PM – 11:00 PM" },
              ].map(({ day, hours }) => (
                <div key={day} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">{day}</span>
                  <span className="text-zinc-300">{hours}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-700 mt-3">
              Last session start at 10:45 PM (15 min) or 10:00 PM (1 hr)
            </p>
          </div>
        </div>
      </div>

      {/* Additional note */}
      <div className="mt-8 rounded-xl border border-vrz-green/15 bg-vrz-green/5 px-6 py-5 flex items-start gap-4">
        <PhoneIcon className="size-5 text-vrz-green shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white mb-1">Walk-ins Welcome</p>
          <p className="text-sm text-zinc-500">
            No reservation? You can still walk in during operating hours if machines are
            available. Booking in advance guarantees your slot.
          </p>
        </div>
      </div>
    </div>
  )
}
