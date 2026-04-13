"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { CheckCircle2Icon, CalendarIcon, ClockIcon, MonitorIcon, ShareIcon } from "lucide-react"
import type { Booking } from "@/hooks/useBookings"

interface BookingSuccessScreenProps {
  booking: Booking
}

export default function BookingSuccessScreen({ booking }: BookingSuccessScreenProps) {
  const dateObj = parseISO(booking.date)

  async function handleShare() {
    const text = `I just booked a VR session at VRZ Byblos! 🎮\nSession: ${booking.id}\nDate: ${format(dateObj, "MMMM d, yyyy")}\nTime: ${booking.startTime} – ${booking.endTime}`
    if (navigator.share) {
      await navigator.share({ text, title: "VRZ Booking" })
    } else {
      await navigator.clipboard.writeText(text)
      alert("Booking details copied to clipboard!")
    }
  }

  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {/* Animated check */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full bg-vrz-green/10 border-2 border-vrz-green flex items-center justify-center vrz-pulse">
          <CheckCircle2Icon className="size-12 text-vrz-green" />
        </div>
      </div>

      <h2
        className="font-heading text-4xl sm:text-5xl text-white mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Booking Confirmed
      </h2>
      <p className="text-zinc-400 text-sm mb-8 max-w-sm">
        Your VR hunting session is locked in. See you in the field.
      </p>

      {/* Booking card */}
      <div className="w-full max-w-sm rounded-xl border border-vrz-green/20 bg-white/3 p-6 text-left mb-8">
        {/* ID */}
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/5">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Booking ID</span>
          <span className="font-heading text-lg text-vrz-green tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
            {booking.id}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="size-4 text-vrz-green shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Date</p>
              <p className="text-sm text-white">{format(dateObj, "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ClockIcon className="size-4 text-vrz-green shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Time</p>
              <p className="text-sm text-white">
                {booking.startTime} – {booking.endTime}
                <span className="ml-2 text-zinc-500 text-xs">({booking.durationMinutes} min)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MonitorIcon className="size-4 text-vrz-green shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Session</p>
              <p className="text-sm text-white">
                {booking.sessionType === "private"
                  ? "Private Full Space (all 6)"
                  : `${booking.machineCount} Machine${booking.machineCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-sm text-zinc-400">Total Paid</span>
            <span className="font-bold text-vrz-green text-xl">${booking.totalPrice}</span>
          </div>
        </div>
      </div>

      {/* Guest info */}
      <div className="w-full max-w-sm rounded-lg border border-white/5 bg-white/2 px-5 py-4 text-left mb-8">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Guest</p>
        <p className="text-sm text-white font-medium">{booking.name}</p>
        <p className="text-xs text-zinc-500 mt-1">{booking.email}</p>
        <p className="text-xs text-zinc-500">{booking.phone}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 flex-1 rounded-lg border border-white/15 py-3 text-sm font-medium text-zinc-300 hover:border-vrz-green/40 hover:text-vrz-green transition-all"
        >
          <ShareIcon className="size-4" />
          Share Booking
        </button>
        <Link
          href="/bookings"
          className="flex items-center justify-center flex-1 rounded-lg bg-vrz-green py-3 text-sm font-semibold text-black hover:bg-vrz-green/90 transition-colors"
        >
          View All Bookings
        </Link>
      </div>
    </div>
  )
}
