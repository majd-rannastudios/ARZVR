"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UsersIcon,
  PartyPopperIcon,
  CheckCircleIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const EVENT_TYPES = ["Festival", "Birthday Party", "Corporate Event", "Private Party", "Other"]

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  eventType: z.string().min(1, "Select an event type"),
  eventDate: z.string().min(1, "Pick a date"),
  location: z.string().min(3, "Where's the event?"),
  guestCount: z.string().min(1, "How many guests?"),
  message: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const INPUT_CLS = "pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-vrz-green"
const SELECT_CLS = "w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors appearance-none"
const LABEL_CLS = "text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider"

export default function EventInquirySection() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setError("Something went wrong sending your request — try WhatsApp instead.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="events" className="py-24 px-4 border-t border-white/5 scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
          {/* Pitch */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">
              We Come To You
            </span>
            <h2 className="font-heading text-4xl sm:text-6xl text-white leading-none mb-6"
              style={{ fontFamily: "var(--font-heading)" }}>
              Book EVO 360<br />For Your Event
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-6">
              Festivals, birthdays, corporate outings, private parties — we bring the full VR
              hunting setup to wherever you are. No trip to Byblos required.
            </p>
            <ul className="space-y-3">
              {[
                "Full VR rig, delivered and set up on-site",
                "Any location — indoor or outdoor",
                "Custom quote based on group size and duration",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircleIcon className="size-4 text-vrz-green shrink-0 mt-0.5" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-white/10 bg-white/2 p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center text-center gap-3 py-8">
                <PartyPopperIcon className="size-10 text-vrz-green" />
                <h3 className="font-heading text-2xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Request sent!
                </h3>
                <p className="text-sm text-zinc-400 max-w-xs">
                  We&apos;ll follow up by email or phone to work out details and pricing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ev-name" className={LABEL_CLS}>Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                      <Input id="ev-name" placeholder="John Doe" className={INPUT_CLS} {...register("name")} />
                    </div>
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="ev-phone" className={LABEL_CLS}>Phone</Label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                      <Input id="ev-phone" type="tel" placeholder="+961 78 880 850" className={INPUT_CLS} {...register("phone")} />
                    </div>
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="ev-email" className={LABEL_CLS}>Email</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                    <Input id="ev-email" type="email" placeholder="you@example.com" className={INPUT_CLS} {...register("email")} />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ev-type" className={LABEL_CLS}>Event Type</Label>
                    <div className="relative">
                      <PartyPopperIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600 pointer-events-none" />
                      <select id="ev-type" defaultValue="" className={SELECT_CLS} {...register("eventType")}>
                        <option value="" disabled>Select type…</option>
                        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {errors.eventType && <p className="text-xs text-red-400 mt-1">{errors.eventType.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="ev-date" className={LABEL_CLS}>Event Date</Label>
                    <Input id="ev-date" type="date" className="h-10 bg-white/5 border-white/10 text-white focus-visible:border-vrz-green" {...register("eventDate")} />
                    {errors.eventDate && <p className="text-xs text-red-400 mt-1">{errors.eventDate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ev-location" className={LABEL_CLS}>Location</Label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                      <Input id="ev-location" placeholder="City / venue" className={INPUT_CLS} {...register("location")} />
                    </div>
                    {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="ev-guests" className={LABEL_CLS}>Expected Guests</Label>
                    <div className="relative">
                      <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                      <Input id="ev-guests" type="number" min="1" placeholder="20" className={INPUT_CLS} {...register("guestCount")} />
                    </div>
                    {errors.guestCount && <p className="text-xs text-red-400 mt-1">{errors.guestCount.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="ev-message" className={LABEL_CLS}>Anything else? (optional)</Label>
                  <textarea
                    id="ev-message"
                    rows={3}
                    placeholder="Duration, indoor/outdoor, power access…"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors resize-none"
                    {...register("message")}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 w-full rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all border-transparent"
                >
                  {submitting ? "Sending…" : "Request a Quote"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
