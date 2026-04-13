"use client"

import { MonitorIcon, UsersIcon, CheckIcon } from "lucide-react"
import type { SessionType } from "@/lib/pricing"

interface BookingStep2Props {
  selected: SessionType | null
  onChange: (type: SessionType) => void
}

const options = [
  {
    type: "single" as SessionType,
    icon: MonitorIcon,
    title: "Single Machine",
    desc: "Your own dedicated VR station. Solo or with a friend watching.",
    details: ["1 of 6 machines", "15 / 30 / 60 min", "From $7"],
  },
  {
    type: "private" as SessionType,
    icon: UsersIcon,
    title: "Private Full Space",
    desc: "Exclusive access to all 6 VR stations. No other guests. Perfect for groups.",
    details: ["All 6 machines", "1 hr or 2 hrs", "From $77"],
    featured: true,
  },
]

export default function BookingStep2({ selected, onChange }: BookingStep2Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2
          className="font-heading text-3xl text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Session Type
        </h2>
        <p className="text-sm text-zinc-500">How do you want to experience VRZ?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {options.map(({ type, icon: Icon, title, desc, details, featured }) => {
          const isSelected = selected === type
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={[
                "relative flex flex-col gap-4 rounded-xl border p-5 text-left transition-all duration-200",
                isSelected
                  ? "border-vrz-green bg-vrz-green/10 border-glow-green"
                  : featured
                  ? "border-white/20 bg-white/3 hover:border-vrz-green/40"
                  : "border-white/10 bg-white/2 hover:border-white/20",
              ].join(" ")}
            >
              {featured && (
                <span className="absolute -top-3 right-4 rounded-full bg-vrz-green px-2.5 py-0.5 text-xs font-bold text-black uppercase tracking-wider">
                  Popular
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-vrz-green">
                  <CheckIcon className="size-3 text-black" />
                </span>
              )}

              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon className={`size-5 ${isSelected ? "text-vrz-green" : "text-zinc-400"}`} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>

              <ul className="flex flex-col gap-1">
                {details.map((d) => (
                  <li key={d} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-1 w-1 rounded-full bg-vrz-green/60 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}
