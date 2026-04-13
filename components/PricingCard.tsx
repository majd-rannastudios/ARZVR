import Link from "next/link"
import { CheckIcon } from "lucide-react"

interface PricingCardProps {
  type: "single" | "private"
  isWeekend: boolean
}

export default function PricingCard({ type, isWeekend }: PricingCardProps) {
  const isSingle = type === "single"

  const singlePrices = isWeekend
    ? [{ duration: "15 min", price: "$10" }, { duration: "30 min", price: "$15" }, { duration: "1 hour", price: "$20" }]
    : [{ duration: "15 min", price: "$7" }, { duration: "30 min", price: "$12" }, { duration: "1 hour", price: "$15" }]

  const privatePrices = isWeekend
    ? [{ duration: "1 hour", price: "$99" }, { duration: "2 hours", price: "$180" }]
    : [{ duration: "1 hour", price: "$77" }, { duration: "2 hours", price: "$145" }]

  const prices = isSingle ? singlePrices : privatePrices

  const features = isSingle
    ? ["1 of 6 VR stations", "Solo or shared visit", "Choose your duration", "Any available machine"]
    : ["All 6 machines exclusive", "Private group experience", "No other guests", "Perfect for events & teams"]

  return (
    <div
      className={[
        "relative flex flex-col rounded-xl border p-6 transition-all duration-300",
        isSingle
          ? "border-white/10 bg-white/3 hover:border-white/20"
          : "border-vrz-green/40 bg-vrz-green/5 hover:border-vrz-green/60 border-glow-green",
      ].join(" ")}
    >
      {!isSingle && (
        <span className="absolute -top-3 left-6 rounded-full bg-vrz-green px-3 py-0.5 text-xs font-bold text-black uppercase tracking-wider">
          Best Value
        </span>
      )}

      <h3
        className="font-heading text-2xl text-white mb-1"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {isSingle ? "Single Machine" : "Private Full Space"}
      </h3>
      <p className="text-sm text-zinc-500 mb-6">
        {isSingle ? "One VR station, your own pace." : "Exclusive access to all 6 machines."}
      </p>

      {/* Pricing table */}
      <div className="flex flex-col gap-2 mb-6">
        {prices.map(({ duration, price }) => (
          <div key={duration} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-zinc-400">{duration}</span>
            <span className={isSingle ? "font-semibold text-white" : "font-bold text-vrz-green text-lg"}>
              {price}
            </span>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-2 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
            <CheckIcon className="size-4 text-vrz-green shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/book"
        className={[
          "mt-auto block text-center rounded-lg py-3 text-sm font-semibold transition-all",
          isSingle
            ? "border border-white/15 text-white hover:border-vrz-green hover:text-vrz-green"
            : "bg-vrz-green text-black hover:bg-vrz-green/90",
        ].join(" ")}
      >
        Book Now
      </Link>
    </div>
  )
}
