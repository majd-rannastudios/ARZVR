"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, parseISO } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  ClockIcon,
  MonitorIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react"
import type { SessionType } from "@/lib/pricing"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
})

type FormValues = z.infer<typeof schema>

interface BookingStep4Props {
  date: Date
  sessionType: SessionType
  durationMinutes: number
  startTime: string
  endTime: string
  machineId?: number
  totalPrice: number
  onConfirm: (name: string, phone: string, email: string) => void
  isSubmitting?: boolean
}

export default function BookingStep4({
  date,
  sessionType,
  durationMinutes,
  startTime,
  endTime,
  machineId,
  totalPrice,
  onConfirm,
  isSubmitting,
}: BookingStep4Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormValues) {
    onConfirm(data.name, data.phone, data.email)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      <div className="text-center">
        <h2
          className="font-heading text-3xl text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Confirm Booking
        </h2>
        <p className="text-sm text-zinc-500">Enter your details and review your session.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Booking Summary</p>

        <div className="flex items-center gap-3 text-sm">
          <CalendarIcon className="size-4 text-vrz-green shrink-0" />
          <span className="text-zinc-300">{format(date, "EEEE, MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ClockIcon className="size-4 text-vrz-green shrink-0" />
          <span className="text-zinc-300">
            {startTime} – {endTime}
            <span className="ml-2 text-zinc-600 text-xs">({durationMinutes} min)</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MonitorIcon className="size-4 text-vrz-green shrink-0" />
          <span className="text-zinc-300">
            {sessionType === "private"
              ? "Private Full Space (all 6 machines)"
              : `Machine #${machineId} — Single Session`}
          </span>
        </div>

        <div className="pt-3 mt-1 border-t border-white/5 flex justify-between items-center">
          <span className="text-sm text-zinc-400">Total</span>
          <span className="font-bold text-vrz-green text-2xl">${totalPrice}</span>
        </div>
      </div>

      {/* Guest form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name" className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">
            Full Name
          </Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
            <Input
              id="name"
              placeholder="John Doe"
              className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-vrz-green"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">
            Phone Number
          </Label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
            <Input
              id="phone"
              type="tel"
              placeholder="+961 70 000 000"
              className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-vrz-green"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">
            Email Address
          </Label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-vrz-green"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all border-transparent"
        >
          {isSubmitting ? "Confirming..." : "Confirm & Book"}
        </Button>
      </form>
    </div>
  )
}
