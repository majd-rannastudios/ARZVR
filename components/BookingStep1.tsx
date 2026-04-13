"use client"

import { Calendar } from "@/components/ui/calendar"
import { format, isBefore, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { isWeekend } from "@/lib/pricing"

interface BookingStep1Props {
  selected: Date | null
  onChange: (date: Date) => void
}

export default function BookingStep1({ selected, onChange }: BookingStep1Props) {
  const today = startOfDay(new Date())

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2
          className="font-heading text-3xl text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Choose Your Date
        </h2>
        <p className="text-sm text-zinc-500">Select the day you want to hunt.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-4 sm:p-6">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={(date) => date && onChange(date)}
          disabled={(date) => isBefore(startOfDay(date), today)}
          className="w-fit"
          classNames={{
            today: "bg-vrz-green/20 text-vrz-green rounded-md",
          }}
        />
      </div>

      {selected && (
        <div className="flex items-center gap-2 rounded-lg border border-vrz-green/30 bg-vrz-green/5 px-4 py-3 text-sm text-vrz-green">
          <CalendarIcon className="size-4" />
          <span>
            {format(selected, "EEEE, MMMM d, yyyy")}
            {isWeekend(selected) && (
              <span className="ml-2 rounded-full bg-vrz-green/20 px-2 py-0.5 text-xs font-medium">
                Weekend pricing
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
