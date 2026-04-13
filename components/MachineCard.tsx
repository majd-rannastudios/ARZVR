import { MonitorIcon, ZapIcon } from "lucide-react"

interface MachineCardProps {
  number: number
  available?: boolean
}

const machineNames = [
  "Alpha Station",
  "Bravo Station",
  "Charlie Station",
  "Delta Station",
  "Echo Station",
  "Foxtrot Station",
]

export default function MachineCard({ number, available = true }: MachineCardProps) {
  const name = machineNames[number - 1] ?? `Station ${number}`

  return (
    <div
      className={[
        "relative flex flex-col gap-4 rounded-xl border p-5 transition-all duration-300 group",
        available
          ? "border-white/10 bg-white/3 hover:border-vrz-green/40 hover:bg-vrz-green/5"
          : "border-white/5 bg-white/1 opacity-50",
      ].join(" ")}
    >
      {/* Machine number badge */}
      <div className="flex items-start justify-between">
        <span
          className="font-heading text-4xl text-white/20 group-hover:text-vrz-green/40 transition-colors"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {String(number).padStart(2, "0")}
        </span>
        <span
          className={[
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            available
              ? "bg-vrz-green/10 text-vrz-green"
              : "bg-red-500/10 text-red-400",
          ].join(" ")}
        >
          <ZapIcon className="size-3" />
          {available ? "Available" : "In Use"}
        </span>
      </div>

      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 group-hover:border-vrz-green/30 transition-colors">
        <MonitorIcon className="size-6 text-zinc-400 group-hover:text-vrz-green transition-colors" />
      </div>

      {/* Name */}
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-zinc-600 mt-0.5">Machine #{number}</p>
      </div>
    </div>
  )
}
