"use client"

import { useState, useMemo } from "react"
import { format, isBefore, startOfDay } from "date-fns"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
} from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ConflictDialog from "@/components/ConflictDialog"
import BookingSuccessScreen from "@/components/BookingSuccessScreen"

import { useBookings, generateBookingId, type Booking } from "@/hooks/useBookings"
import {
  getPricing,
  getSingleDurations,
  getPrivateDurations,
  isWeekend,
  type SessionType,
} from "@/lib/pricing"
import { generateSlots } from "@/lib/timeSlots"
import {
  getAvailableMachineCount,
  hasPrivateConflict,
  hasSingleConflict,
} from "@/lib/conflicts"

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
})
type FormValues = z.infer<typeof schema>

export default function BookingSection() {
  const { bookings, addBooking } = useBookings()

  const [step, setStep] = useState<1 | 2>(1)
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null)

  const today = startOfDay(new Date())
  const [date, setDate] = useState<Date | null>(null)
  const [sessionType, setSessionType] = useState<SessionType>("single")
  const [duration, setDuration] = useState<number | null>(null)
  const [machineCount, setMachineCount] = useState(1)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [conflictOpen, setConflictOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const weekend = date ? isWeekend(date) : false
  const durations = sessionType === "single" ? getSingleDurations() : getPrivateDurations()
  const slots = useMemo(() => (duration ? generateSlots(duration) : []), [duration])
  const dateStr = date ? format(date, "yyyy-MM-dd") : ""

  const availableCount = useMemo(() => {
    if (!dateStr || !startTime || !endTime) return 6
    return getAvailableMachineCount(bookings, dateStr, startTime, endTime)
  }, [bookings, dateStr, startTime, endTime])

  const unitPrice = date && duration ? getPricing(date, sessionType, duration) : 0
  const totalPrice = sessionType === "private" ? unitPrice : unitPrice * machineCount

  const step1Ready = !!date && !!duration
  const step2Ready = !!startTime

  function handleSlotSelect(slot: { startTime: string; endTime: string }) {
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    if (sessionType === "private") {
      if (hasPrivateConflict(bookings, dateStr, slot.startTime, slot.endTime)) {
        setConflictOpen(true)
      }
    } else if (hasSingleConflict(bookings, dateStr, slot.startTime, slot.endTime, machineCount)) {
      setStartTime("")
      setEndTime("")
    }
  }

  function onSubmit(data: FormValues) {
    if (!date || !duration || !startTime || !endTime) return
    setIsSubmitting(true)
    const booking: Booking = {
      id: generateBookingId(date),
      date: dateStr,
      startTime,
      endTime,
      sessionType,
      machineCount: sessionType === "private" ? 6 : machineCount,
      name: data.name,
      phone: data.phone,
      email: data.email,
      totalPrice,
      durationMinutes: duration,
      createdAt: new Date().toISOString(),
    }
    addBooking(booking)
    setIsSubmitting(false)
    setCompletedBooking(booking)
  }

  if (completedBooking) {
    return <BookingSuccessScreen booking={completedBooking} />
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[{ n: 1, label: "Session" }, { n: 2, label: "Time & Confirm" }].map(({ n, label }) => {
          const active = step === n
          const done = step > n
          return (
            <div key={n} className="flex items-center gap-2">
              <span className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                active ? "bg-vrz-green text-black shadow-[0_0_12px_#00FF7F50]"
                  : done ? "bg-vrz-green/20 text-vrz-green border border-vrz-green/40"
                  : "bg-white/5 text-zinc-600 border border-white/10",
              ].join(" ")}>
                {done ? <CheckIcon className="size-3.5" /> : n}
              </span>
              <span className={`text-sm ${active ? "text-white" : "text-zinc-600"}`}>{label}</span>
              {n < 2 && <ChevronRightIcon className="size-4 text-zinc-700" />}
            </div>
          )
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <div className="rounded-xl border border-white/8 bg-white/2 p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={(d) => { if (d) { setDate(d); setStartTime(""); setEndTime("") } }}
              disabled={(d) => isBefore(startOfDay(d), today)}
            />
          </div>

          <div className="flex flex-col gap-5 rounded-xl border border-white/8 bg-white/2 p-6">
            {/* Session type */}
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Session Type</p>
              <div className="flex gap-2">
                {(["single", "private"] as SessionType[]).map((t) => (
                  <button key={t} onClick={() => { setSessionType(t); setDuration(null); setMachineCount(1); setStartTime(""); setEndTime("") }}
                    className={["flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all",
                      sessionType === t ? "border-vrz-green bg-vrz-green/10 text-vrz-green" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
                    ].join(" ")}>
                    {t === "single" ? "Single Machine" : "Private Full Space"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {sessionType === "single" ? "Book 1–6 machines independently." : "Exclusive access to all 6 machines. No other guests."}
              </p>
            </div>

            {/* Duration */}
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Duration</p>
              <div className="flex flex-wrap gap-2">
                {durations.map((d) => {
                  const price = weekend ? d.weekend : d.weekday
                  const selected = duration === d.value
                  return (
                    <button key={d.value} onClick={() => { setDuration(d.value); setStartTime(""); setEndTime("") }}
                      className={["flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all",
                        selected ? "border-vrz-green bg-vrz-green/10 text-vrz-green" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
                      ].join(" ")}>
                      {d.label}
                      <span className={`text-xs ${selected ? "text-vrz-green/70" : "text-zinc-600"}`}>
                        ${price}{sessionType === "single" && "/m"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Machine count */}
            {sessionType === "single" && (
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">How Many Machines?</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setMachineCount((c) => Math.max(1, c - 1))} disabled={machineCount <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-all disabled:opacity-30">
                    <MinusIcon className="size-4" />
                  </button>
                  <div className="flex flex-col items-center min-w-[3rem]">
                    <span className="text-2xl font-bold text-white">{machineCount}</span>
                    <span className="text-xs text-zinc-600">{machineCount === 1 ? "machine" : "machines"}</span>
                  </div>
                  <button onClick={() => setMachineCount((c) => Math.min(6, c + 1))} disabled={machineCount >= 6}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-all disabled:opacity-30">
                    <PlusIcon className="size-4" />
                  </button>
                  <div className="flex gap-1.5 ml-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button key={n} onClick={() => setMachineCount(n)}
                        className={["h-2.5 w-2.5 rounded-full transition-all", n <= machineCount ? "bg-vrz-green shadow-[0_0_6px_#00FF7F]" : "bg-white/15"].join(" ")}
                        aria-label={`${n} machine${n > 1 ? "s" : ""}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Price preview */}
            {date && duration && (
              <div className="mt-auto rounded-lg border border-vrz-green/20 bg-vrz-green/5 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  {sessionType === "single" ? `${machineCount} × $${unitPrice}` : "Private"} — {format(date, "MMM d")}
                  {weekend && <span className="ml-2 text-xs text-vrz-green/70">weekend</span>}
                </div>
                <span className="text-xl font-bold text-vrz-green">${totalPrice}</span>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!step1Ready}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-vrz-green py-3 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              Pick a Time Slot <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && date && duration && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-xl border border-white/8 bg-white/2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-0.5">Available Slots</p>
                <p className="text-sm text-zinc-300">
                  {format(date, "EEEE, MMMM d")} · {duration} min
                  {sessionType === "single" && ` · ${machineCount} machine${machineCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => { setStep(1); setStartTime(""); setEndTime("") }}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
                <ChevronLeftIcon className="size-3.5" /> Change
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isSel = startTime === slot.startTime
                const avail = sessionType === "private"
                  ? !hasPrivateConflict(bookings, dateStr, slot.startTime, slot.endTime)
                  : getAvailableMachineCount(bookings, dateStr, slot.startTime, slot.endTime) >= machineCount
                return (
                  <button key={slot.startTime} onClick={() => handleSlotSelect(slot)} disabled={!avail}
                    className={["rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                      isSel ? "border-vrz-green bg-vrz-green/10 text-vrz-green shadow-[0_0_8px_#00FF7F30]"
                        : avail ? "border-white/10 text-zinc-300 hover:border-white/20 hover:text-white"
                        : "border-white/5 text-zinc-700 cursor-not-allowed opacity-40",
                    ].join(" ")}>
                    {slot.label}
                  </button>
                )
              })}
            </div>

            {sessionType === "single" && availableCount < machineCount && startTime && (
              <p className="mt-3 text-xs text-amber-400">
                Only {availableCount} machine{availableCount !== 1 ? "s" : ""} free in this slot.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 rounded-xl border border-white/8 bg-white/2 p-6">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Your Details</p>

            <div className="space-y-3">
              {[
                { id: "name", label: "Name", icon: UserIcon, type: "text", placeholder: "John Doe", reg: register("name"), err: errors.name },
                { id: "phone", label: "Phone", icon: PhoneIcon, type: "tel", placeholder: "+961 70 000 000", reg: register("phone"), err: errors.phone },
                { id: "email", label: "Email", icon: MailIcon, type: "email", placeholder: "you@example.com", reg: register("email"), err: errors.email },
              ].map(({ id, label, icon: Icon, type, placeholder, reg, err }) => (
                <div key={id}>
                  <Label htmlFor={id} className="text-xs text-zinc-500 mb-1.5 block">{label}</Label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                    <Input id={id} type={type} placeholder={placeholder}
                      className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-zinc-600 focus-visible:border-vrz-green"
                      {...reg} />
                  </div>
                  {err && <p className="text-xs text-red-400 mt-1">{err.message}</p>}
                </div>
              ))}
            </div>

            {startTime && (
              <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3 text-sm space-y-1.5">
                {[
                  ["Date", format(date, "MMM d, yyyy")],
                  ["Time", `${startTime} – ${endTime}`],
                  ["Session", sessionType === "private" ? "Private (all 6)" : `${machineCount} machine${machineCount > 1 ? "s" : ""}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-zinc-400">
                    <span>{k}</span><span className="text-zinc-200">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                  <span className="text-zinc-400">Total</span>
                  <span className="text-lg font-bold text-vrz-green">${totalPrice}</span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={!step2Ready || isSubmitting}
              className="h-12 w-full rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 border-transparent disabled:opacity-30">
              {isSubmitting ? "Booking..." : "Confirm Booking →"}
            </Button>
          </form>
        </div>
      )}

      <ConflictDialog open={conflictOpen} onClose={() => setConflictOpen(false)} />
    </div>
  )
}
