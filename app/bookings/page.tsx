"use client"

import { useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  CalendarIcon,
  ClockIcon,
  MonitorIcon,
  Trash2Icon,
  ArrowRightIcon,
  InboxIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useBookings, type Booking } from "@/hooks/useBookings"

export default function BookingsPage() {
  const { bookings, cancelBooking } = useBookings()
  const [toCancel, setToCancel] = useState<Booking | null>(null)

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  function confirmCancel() {
    if (toCancel) {
      cancelBooking(toCancel.id)
      setToCancel(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1
            className="font-heading text-4xl sm:text-6xl text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My Bookings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {sorted.length} {sorted.length === 1 ? "session" : "sessions"} stored locally
          </p>
        </div>
        <Link
          href="/book"
          className="flex items-center gap-2 rounded-lg bg-vrz-green px-4 py-2.5 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all"
        >
          Book More
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-white/8 bg-white/2 py-20 text-center">
          <InboxIcon className="size-12 text-zinc-700" />
          <h2 className="text-lg font-semibold text-zinc-400">No bookings yet</h2>
          <p className="text-sm text-zinc-600 max-w-xs">
            Your booked sessions will appear here. Go claim your machine.
          </p>
          <Link
            href="/book"
            className="mt-2 flex items-center gap-2 rounded-lg bg-vrz-green px-6 py-3 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all"
          >
            Book a Session
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((booking) => {
            const dateObj = parseISO(booking.date)
            return (
              <div
                key={booking.id}
                className="group relative rounded-xl border border-white/8 bg-white/2 p-5 hover:border-white/15 transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span
                      className="font-heading text-lg text-vrz-green tracking-wider"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {booking.id}
                    </span>
                    <span className="ml-3 rounded-full border border-vrz-green/30 bg-vrz-green/10 px-2 py-0.5 text-xs text-vrz-green">
                      Confirmed
                    </span>
                  </div>
                  <button
                    onClick={() => setToCancel(booking)}
                    className="p-2 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Cancel booking"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="size-4 text-vrz-green shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-600">Date</p>
                      <p className="text-zinc-300">{format(dateObj, "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="size-4 text-vrz-green shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-600">Time</p>
                      <p className="text-zinc-300">
                        {booking.startTime} – {booking.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MonitorIcon className="size-4 text-vrz-green shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-600">Session</p>
                      <p className="text-zinc-300">
                        {booking.sessionType === "private"
                          ? "Private Full Space (all 6)"
                          : `${booking.machineCount} Machine${booking.machineCount > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    {booking.name} · {booking.durationMinutes} min
                  </span>
                  <span className="font-bold text-vrz-green">${booking.totalPrice}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      <Dialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <DialogContent className="sm:max-w-sm border-red-500/20 bg-black">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Booking</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to cancel{" "}
              <span className="text-vrz-green font-mono">{toCancel?.id}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="ghost" onClick={() => setToCancel(null)} className="text-zinc-400">
              Keep It
            </Button>
            <Button
              onClick={confirmCancel}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
