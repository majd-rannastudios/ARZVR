"use client"

import { useEffect, useState } from "react"
import { CheckIcon, MonitorIcon, ClockIcon, AlertTriangleIcon } from "lucide-react"
import { generateSlots } from "@/lib/timeSlots"
import { getAvailableMachines, hasPrivateConflict } from "@/lib/conflicts"
import { getSingleDurations, getPrivateDurations, isWeekend } from "@/lib/pricing"
import type { SessionType } from "@/lib/pricing"
import type { Booking } from "@/hooks/useBookings"
import ConflictDialog from "@/components/ConflictDialog"

interface BookingStep3Props {
  sessionType: SessionType
  date: Date
  bookings: Booking[]
  // Controlled state lifted to parent
  duration: number | null
  setDuration: (d: number) => void
  startTime: string | null
  setStartTime: (t: string) => void
  endTime: string | null
  setEndTime: (t: string) => void
  machineId: number | null
  setMachineId: (m: number) => void
}

export default function BookingStep3({
  sessionType,
  date,
  bookings,
  duration,
  setDuration,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  machineId,
  setMachineId,
}: BookingStep3Props) {
  const weekend = isWeekend(date)
  const dateStr = date.toISOString().split("T")[0]

  const durations =
    sessionType === "single" ? getSingleDurations() : getPrivateDurations()

  const slots = duration ? generateSlots(duration) : []

  const [conflictOpen, setConflictOpen] = useState(false)
  const [availableMachines, setAvailableMachines] = useState<number[]>([1, 2, 3, 4, 5, 6])

  // Recalculate available machines when slot or duration changes
  useEffect(() => {
    if (!startTime || !endTime) {
      setAvailableMachines([1, 2, 3, 4, 5, 6])
      return
    }
    setAvailableMachines(getAvailableMachines(bookings, dateStr, startTime, endTime))
  }, [startTime, endTime, bookings, dateStr])

  function handleSlotSelect(slot: { startTime: string; endTime: string }) {
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    // Reset machine when slot changes
    if (sessionType === "single") setMachineId(0)
    // Check for private conflict
    if (sessionType === "private") {
      const conflict = hasPrivateConflict(bookings, dateStr, slot.startTime, slot.endTime)
      if (conflict) setConflictOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2
          className="font-heading text-3xl text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {sessionType === "single" ? "Machine & Time" : "Duration & Time"}
        </h2>
        <p className="text-sm text-zinc-500">
          {sessionType === "single"
            ? "Pick your duration, then choose a time slot and machine."
            : "Pick your duration and a time slot."}
        </p>
      </div>

      {/* Duration selection */}
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Duration</p>
        <div className="flex flex-wrap gap-2">
          {durations.map((d) => {
            const price = weekend ? d.weekend : d.weekday
            const selected = duration === d.value
            return (
              <button
                key={d.value}
                onClick={() => {
                  setDuration(d.value)
                  setStartTime("")
                  setEndTime("")
                  if (sessionType === "single") setMachineId(0)
                }}
                className={[
                  "flex flex-col items-center rounded-lg border px-4 py-3 text-left transition-all min-w-[90px]",
                  selected
                    ? "border-vrz-green bg-vrz-green/10 text-vrz-green"
                    : "border-white/10 bg-white/3 text-zinc-400 hover:border-white/20 hover:text-white",
                ].join(" ")}
              >
                <span className="text-sm font-semibold">{d.label}</span>
                <span className={`text-xs mt-0.5 ${selected ? "text-vrz-green/70" : "text-zinc-600"}`}>
                  ${price}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slot selection */}
      {duration && (
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
            <ClockIcon className="size-3" />
            Time Slot
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const selected = startTime === slot.startTime
              return (
                <button
                  key={slot.startTime}
                  onClick={() => handleSlotSelect(slot)}
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    selected
                      ? "border-vrz-green bg-vrz-green/10 text-vrz-green"
                      : "border-white/10 bg-white/3 text-zinc-400 hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  {slot.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Machine selection (single only) */}
      {sessionType === "single" && startTime && (
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
            <MonitorIcon className="size-3" />
            Choose Machine
          </p>
          {availableMachines.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              <AlertTriangleIcon className="size-4 shrink-0" />
              All machines are taken for this slot. Please choose a different time.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((m) => {
                const available = availableMachines.includes(m)
                const selected = machineId === m
                return (
                  <button
                    key={m}
                    disabled={!available}
                    onClick={() => setMachineId(m)}
                    className={[
                      "flex flex-col items-center justify-center rounded-lg border py-3 text-sm font-semibold transition-all",
                      selected
                        ? "border-vrz-green bg-vrz-green/10 text-vrz-green"
                        : available
                        ? "border-white/10 bg-white/3 text-zinc-300 hover:border-white/20"
                        : "border-white/5 bg-white/1 text-zinc-700 cursor-not-allowed opacity-40",
                    ].join(" ")}
                  >
                    <MonitorIcon className="size-4 mb-1" />
                    #{m}
                    {selected && <CheckIcon className="size-3 text-vrz-green mt-0.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Private: soft conflict indicator */}
      {sessionType === "private" && startTime && (
        <div className="flex items-center gap-2 rounded-lg border border-vrz-green/20 bg-vrz-green/5 px-4 py-3 text-sm text-vrz-green">
          <CheckIcon className="size-4" />
          Full space selected — {startTime} to {endTime}
        </div>
      )}

      <ConflictDialog open={conflictOpen} onClose={() => setConflictOpen(false)} />
    </div>
  )
}
