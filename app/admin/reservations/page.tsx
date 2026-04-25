"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Booking {
  id: string; date: string; start_time: string; end_time: string
  session_type: string; machine_count: number; name: string
  phone: string; email: string; total_price: number; duration_minutes: number
  status: string; created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-vrz-green/10 text-vrz-green border-vrz-green/20",
  cancelled:  "bg-red-500/10 text-red-400 border-red-500/20",
  completed:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

export default function ReservationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [month, setMonth] = useState(new Date())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    const from = format(startOfMonth(month), "yyyy-MM-dd")
    const to = format(endOfMonth(month), "yyyy-MM-dd")
    supabase.from("bookings").select("*").gte("date", from).lte("date", to)
      .order("date", { ascending: true }).order("start_time", { ascending: true })
      .then(({ data }) => { setBookings(data ?? []); setLoading(false) })
  }, [month])

  const filtered = bookings.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  )

  // Group by date
  const grouped = filtered.reduce<Record<string, Booking[]>>((acc, b) => {
    acc[b.date] = [...(acc[b.date] ?? []), b]
    return acc
  }, {})

  const monthRevenue = filtered.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from("bookings").update({ status }).eq("id", id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Reservations</h1>
          <p className="text-sm text-zinc-500 mt-1">{filtered.length} bookings · ${monthRevenue.toLocaleString()} revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-all">
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="px-3 text-sm text-white font-medium min-w-[110px] text-center">{format(month, "MMMM yyyy")}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-all">
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID or email…"
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CalendarIcon className="size-10 text-zinc-700" />
          <p className="text-zinc-500 text-sm">No bookings found for {format(month, "MMMM yyyy")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayBookings]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-vrz-green uppercase tracking-wider">
                  {format(parseISO(date), "EEEE, MMMM d")}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-zinc-600">${dayBookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)}</span>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/5">
                    {dayBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/2 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                        <td className="px-4 py-3 font-mono text-xs text-vrz-green w-36">{b.id}</td>
                        <td className="px-4 py-3 text-zinc-200">{b.name}</td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{b.start_time} – {b.end_time}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-zinc-400">
                            {b.session_type === "private" ? "Private (all 6)" : `${b.machine_count}× machine`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[b.status] ?? STATUS_COLORS.confirmed}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-vrz-green font-medium">${b.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm bg-black border-l border-white/8 p-6 overflow-y-auto space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Booking Detail</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="font-mono text-lg text-vrz-green">{selected.id}</div>
            {[
              ["Date", format(parseISO(selected.date), "MMMM d, yyyy")],
              ["Time", `${selected.start_time} – ${selected.end_time}`],
              ["Duration", `${selected.duration_minutes} min`],
              ["Session", selected.session_type === "private" ? "Private (all 6)" : `${selected.machine_count}× Single`],
              ["Guest", selected.name],
              ["Phone", selected.phone],
              ["Email", selected.email],
              ["Amount", `$${selected.total_price}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-200">{v}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {selected.status !== "completed" && (
                <button onClick={() => updateStatus(selected.id, "completed")}
                  className="flex-1 rounded-lg bg-vrz-green/10 border border-vrz-green/20 text-vrz-green text-xs py-2 hover:bg-vrz-green/20 transition-all">
                  Mark Completed
                </button>
              )}
              {selected.status !== "cancelled" && (
                <button onClick={() => updateStatus(selected.id, "cancelled")}
                  className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 hover:bg-red-500/20 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
