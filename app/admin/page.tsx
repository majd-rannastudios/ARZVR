import { createClient } from "@/lib/supabase/server"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon, UsersIcon, ActivityIcon } from "lucide-react"
import Link from "next/link"

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd")

  const [
    { data: todayBookings },
    { data: monthBookings },
    { data: monthExpenses },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("bookings").select("*").eq("date", todayStr).neq("status", "cancelled"),
    supabase.from("bookings").select("total_price").gte("date", monthStart).lte("date", monthEnd).neq("status", "cancelled"),
    supabase.from("expenses").select("amount").gte("date", monthStart).lte("date", monthEnd),
    supabase.from("bookings").select("*").neq("status", "cancelled").order("created_at", { ascending: false }).limit(8),
  ])

  const todayRevenue = (todayBookings ?? []).reduce((s, b) => s + (b.total_price ?? 0), 0)
  const monthRevenue = (monthBookings ?? []).reduce((s, b) => s + (b.total_price ?? 0), 0)
  const monthExpTotal = (monthExpenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  const netPL = monthRevenue - monthExpTotal

  const cards = [
    { label: "Today's Revenue", value: `$${todayRevenue}`, sub: `${todayBookings?.length ?? 0} bookings`, icon: DollarSignIcon, green: true },
    { label: "Month Revenue", value: `$${monthRevenue.toLocaleString()}`, sub: format(today, "MMMM yyyy"), icon: TrendingUpIcon, green: true },
    { label: "Month Expenses", value: `$${monthExpTotal.toLocaleString()}`, sub: "all categories", icon: TrendingDownIcon, green: false },
    { label: "Net P&L", value: `${netPL >= 0 ? "+" : ""}$${netPL.toLocaleString()}`, sub: "revenue – expenses", icon: ActivityIcon, green: netPL >= 0 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, green }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/2 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${green ? "bg-vrz-green/10 border border-vrz-green/20" : "bg-white/5 border border-white/10"}`}>
                <Icon className={`size-4 ${green ? "text-vrz-green" : "text-zinc-500"}`} />
              </div>
            </div>
            <p className={`font-heading text-3xl ${green ? "text-vrz-green" : "text-white"}`} style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            <p className="text-xs text-zinc-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Today's bookings */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-vrz-green" />
            <h2 className="text-sm font-semibold text-white">Today&apos;s Bookings</h2>
          </div>
          <Link href="/admin/reservations" className="text-xs text-zinc-500 hover:text-vrz-green transition-colors">View all →</Link>
        </div>
        {!todayBookings?.length ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-600">No bookings today</div>
        ) : (
          <div className="divide-y divide-white/5">
            {todayBookings.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-vrz-green shrink-0">{b.id}</span>
                  <span className="text-sm text-zinc-300 truncate">{b.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <span className="text-zinc-500">{b.start_time} – {b.end_time}</span>
                  <span className="text-vrz-green font-medium">${b.total_price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent bookings */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <UsersIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Guest</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(recentBookings ?? []).map((b) => (
                <tr key={b.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-vrz-green">{b.id}</td>
                  <td className="px-5 py-3 text-zinc-300">{b.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{b.date}</td>
                  <td className="px-5 py-3 text-zinc-400">{b.start_time} – {b.end_time}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.session_type === "private" ? "bg-vrz-green/10 text-vrz-green" : "bg-white/5 text-zinc-400"}`}>
                      {b.session_type === "private" ? "Private" : `${b.machine_count}× Single`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-vrz-green">${b.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
