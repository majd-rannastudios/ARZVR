"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import { TrendingUpIcon, TrendingDownIcon, ActivityIcon, BarChart3Icon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Period = "month" | "ytd" | "all"

interface Expense { phase: string; category: string; amount: number; date: string }
interface Booking { total_price: number; date: string; status: string }
interface Receivable { amount: number; date: string }

const CATEGORY_LABELS: Record<string, string> = {
  renovation: "Renovation", vr_sets: "VR Headsets", vr_guns: "VR Guns",
  furniture: "Furniture", signage: "Signage", other_capex: "Other CapEx",
  rent: "Rent", salaries: "Salaries", electricity: "Electricity",
  internet: "Internet", maintenance: "Maintenance", cleaning: "Cleaning", other_opex: "Other OpEx",
}

export default function FinancialsPage() {
  const [period, setPeriod] = useState<Period>("month")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()

  function getRange(): { from: string; to: string } {
    if (period === "month") return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    }
    if (period === "ytd") return {
      from: format(startOfYear(now), "yyyy-MM-dd"),
      to: format(now, "yyyy-MM-dd"),
    }
    return { from: "2000-01-01", to: "2099-12-31" }
  }

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    const { from, to } = getRange()
    Promise.all([
      supabase.from("bookings").select("total_price, date, status").gte("date", from).lte("date", to),
      supabase.from("expenses").select("phase, category, amount, date").gte("date", from).lte("date", to),
      supabase.from("receivables").select("amount, date").gte("date", from).lte("date", to),
    ]).then(([b, e, r]) => {
      setBookings(b.data ?? [])
      setExpenses(e.data ?? [])
      setReceivables(r.data ?? [])
      setLoading(false)
    })
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const bookingRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)
  const receivableTotal = receivables.reduce((s, r) => s + r.amount, 0)
  const totalRevenue = bookingRevenue + receivableTotal
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const capex = expenses.filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
  const opex = expenses.filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
  const grossProfit = bookingRevenue - opex
  const netPL = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0"

  // Expense breakdown by category
  const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const sortedCats = Object.entries(byCat).sort(([, a], [, b]) => b - a)

  // Last 6 months revenue for mini chart data
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return { label: format(d, "MMM"), month: format(d, "yyyy-MM") }
  })

  const PERIOD_LABELS: Record<Period, string> = {
    month: format(now, "MMMM yyyy"),
    ytd: `YTD ${now.getFullYear()}`,
    all: "All Time",
  }

  return (
    <div className="space-y-8">
      {/* Header + period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>P&amp;L</h1>
          <p className="text-sm text-zinc-500 mt-1">{PERIOD_LABELS[period]}</p>
        </div>
        <div className="inline-flex rounded-lg border border-white/10 p-1 gap-1">
          {(["month", "ytd", "all"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${period === p ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
              {p === "month" ? "This Month" : p === "ytd" ? "YTD" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">Loading…</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUpIcon, color: "vrz-green" },
              { label: "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDownIcon, color: "red" },
              { label: "Net P&L", value: `${netPL >= 0 ? "+" : ""}$${netPL.toLocaleString()}`, icon: ActivityIcon, color: netPL >= 0 ? "vrz-green" : "red" },
              { label: "Gross Margin", value: `${margin}%`, icon: BarChart3Icon, color: parseFloat(margin) >= 0 ? "vrz-green" : "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/2 p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
                  <Icon className={`size-4 text-${color}`} />
                </div>
                <p className={`font-heading text-2xl text-${color}`} style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/8 bg-white/2 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUpIcon className="size-4 text-vrz-green" />
                <h2 className="text-sm font-semibold text-white">Revenue Breakdown</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Booking Revenue", value: bookingRevenue, of: totalRevenue },
                  { label: "Other Receivables", value: receivableTotal, of: totalRevenue },
                ].map(({ label, value, of }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{label}</span>
                      <span className="text-white font-medium">${value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-vrz-green rounded-full transition-all" style={{ width: of > 0 ? `${(value / of) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDownIcon className="size-4 text-red-400" />
                <h2 className="text-sm font-semibold text-white">Expense Split</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "CapEx (Pre-launch)", value: capex, color: "bg-amber-400", of: totalExpenses },
                  { label: "OpEx (Operational)", value: opex, color: "bg-vrz-green", of: totalExpenses },
                ].map(({ label, value, color, of }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{label}</span>
                      <span className="text-white font-medium">${value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: of > 0 ? `${(value / of) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expense by category */}
          {sortedCats.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/2 p-5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3Icon className="size-4 text-vrz-green" />
                <h2 className="text-sm font-semibold text-white">Expense by Category</h2>
              </div>
              <div className="space-y-3">
                {sortedCats.map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400 w-40 shrink-0 truncate">{CATEGORY_LABELS[cat] ?? cat}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-vrz-green/70 rounded-full" style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                    </div>
                    <span className="text-sm text-white font-medium w-20 text-right shrink-0">${amt.toLocaleString()}</span>
                    <span className="text-xs text-zinc-600 w-10 text-right shrink-0">{((amt / totalExpenses) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* P&L summary table */}
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">P&amp;L Summary</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {[
                  { label: "Booking Revenue", value: bookingRevenue, indent: true },
                  { label: "Other Receivables", value: receivableTotal, indent: true },
                  { label: "Total Revenue", value: totalRevenue, bold: true },
                  { label: "OpEx", value: -opex, indent: true, red: true },
                  { label: "Gross Profit", value: grossProfit, bold: true },
                  { label: "CapEx", value: -capex, indent: true, red: true },
                  { label: "Net P&L", value: netPL, bold: true, big: true },
                ].map(({ label, value, indent, bold, big, red }) => (
                  <tr key={label} className={bold ? "bg-white/2" : ""}>
                    <td className={`px-5 py-3 ${indent ? "pl-8 text-zinc-400" : "text-zinc-300 font-medium"}`}>{label}</td>
                    <td className={`px-5 py-3 text-right font-${bold ? "bold" : "normal"} ${big ? "text-lg" : ""} ${red ? "text-red-400" : value >= 0 ? "text-vrz-green" : "text-red-400"}`}>
                      {value >= 0 ? `$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
