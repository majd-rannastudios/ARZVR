"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, CalendarIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sendBookingEmail } from "@/lib/sendEmail"

interface Booking {
  id: string; date: string; start_time: string; end_time: string
  session_type: string; machine_count: number; name: string
  phone: string; email: string; total_price: number; duration_minutes: number
  status: string; created_at: string
}

interface EditState {
  date: string; start_time: string; end_time: string
  session_type: string; machine_count: number
  name: string; phone: string; email: string; total_price: string
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-vrz-green/10 text-vrz-green border-vrz-green/20",
  cancelled:  "bg-red-500/10 text-red-400 border-red-500/20",
  completed:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const INPUT = "w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const SELECT = "w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"

export default function ReservationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [month, setMonth] = useState(new Date())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [editing, setEditing] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

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

  const grouped = filtered.reduce<Record<string, Booking[]>>((acc, b) => {
    acc[b.date] = [...(acc[b.date] ?? []), b]
    return acc
  }, {})

  const monthRevenue = filtered.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)

  function openEdit(b: Booking) {
    setEditState({
      date: b.date, start_time: b.start_time, end_time: b.end_time,
      session_type: b.session_type, machine_count: b.machine_count,
      name: b.name, phone: b.phone, email: b.email,
      total_price: String(b.total_price),
    })
    setEditing(true)
  }

  function cancelEdit() { setEditing(false); setEditState(null) }

  async function saveEdit() {
    if (!selected || !editState) return
    setSaving(true)
    const supabase = createClient()
    const patch = {
      date: editState.date,
      start_time: editState.start_time,
      end_time: editState.end_time,
      session_type: editState.session_type,
      machine_count: editState.session_type === "private" ? 6 : Number(editState.machine_count),
      name: editState.name,
      phone: editState.phone,
      email: editState.email,
      total_price: parseFloat(editState.total_price) || selected.total_price,
    }
    await supabase.from("bookings").update(patch).eq("id", selected.id)
    const updated: Booking = { ...selected, ...patch }
    setBookings(prev => prev.map(b => b.id === selected.id ? updated : b))
    setSelected(updated)
    setEditing(false)
    setEditState(null)
    setSaving(false)
    sendBookingEmail("updated", {
      id: updated.id, name: updated.name, email: updated.email,
      date: updated.date, start_time: updated.start_time, end_time: updated.end_time,
      session_type: updated.session_type, machine_count: updated.machine_count,
      total_price: updated.total_price, duration_minutes: updated.duration_minutes,
    })
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from("bookings").update({ status }).eq("id", id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    const updated = bookings.find(b => b.id === id)
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    if (updated) {
      sendBookingEmail(status as "cancelled" | "completed", {
        id: updated.id, name: updated.name, email: updated.email,
        date: updated.date, start_time: updated.start_time, end_time: updated.end_time,
        session_type: updated.session_type, machine_count: updated.machine_count,
        total_price: updated.total_price, duration_minutes: updated.duration_minutes,
      })
    }
  }

  function field(label: string, key: keyof EditState, type = "text") {
    return (
      <div key={key}>
        <label className="text-xs text-zinc-600 uppercase tracking-wider mb-1 block">{label}</label>
        <input type={type} value={editState?.[key] ?? ""} onChange={e => setEditState(s => s ? { ...s, [key]: e.target.value } : s)}
          className={INPUT} />
      </div>
    )
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or email…"
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors" />
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
                      <tr key={b.id} className="hover:bg-white/2 transition-colors cursor-pointer" onClick={() => { setSelected(b); setEditing(false) }}>
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

      {/* Slide-over detail / edit panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setSelected(null); setEditing(false) }}>
          <div className="w-full max-w-sm bg-black border-l border-white/8 p-6 overflow-y-auto space-y-5" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
                {editing ? "Edit Booking" : "Booking Detail"}
              </h2>
              <div className="flex items-center gap-2">
                {!editing && selected.status !== "cancelled" && (
                  <button onClick={() => openEdit(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-xs transition-all">
                    <PencilIcon className="size-3" /> Edit
                  </button>
                )}
                <button onClick={() => { setSelected(null); setEditing(false) }} className="text-zinc-500 hover:text-white transition-colors">
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            <div className="font-mono text-sm text-vrz-green">{selected.id}</div>

            {/* READ MODE */}
            {!editing && (
              <>
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
                  {selected.status !== "completed" && selected.status !== "cancelled" && (
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
              </>
            )}

            {/* EDIT MODE */}
            {editing && editState && (
              <div className="space-y-4">
                {field("Date", "date", "date")}
                <div className="grid grid-cols-2 gap-3">
                  {field("Start time", "start_time", "time")}
                  {field("End time", "end_time", "time")}
                </div>

                <div>
                  <label className="text-xs text-zinc-600 uppercase tracking-wider mb-1 block">Session type</label>
                  <select value={editState.session_type}
                    onChange={e => setEditState(s => s ? { ...s, session_type: e.target.value, machine_count: e.target.value === "private" ? 6 : s.machine_count } : s)}
                    className={SELECT}>
                    <option value="single">Single machines</option>
                    <option value="private">Private (full space)</option>
                  </select>
                </div>

                {editState.session_type === "single" && (
                  <div>
                    <label className="text-xs text-zinc-600 uppercase tracking-wider mb-1 block">Machines</label>
                    <select value={editState.machine_count}
                      onChange={e => setEditState(s => s ? { ...s, machine_count: Number(e.target.value) } : s)}
                      className={SELECT}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}

                {field("Guest name", "name")}
                {field("Phone", "phone", "tel")}
                {field("Email", "email", "email")}

                <div>
                  <label className="text-xs text-zinc-600 uppercase tracking-wider mb-1 block">Amount ($)</label>
                  <input type="number" min="0" step="0.01" value={editState.total_price}
                    onChange={e => setEditState(s => s ? { ...s, total_price: e.target.value } : s)}
                    className={INPUT} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-vrz-green text-black text-xs font-bold py-2.5 hover:bg-vrz-green/90 transition-all disabled:opacity-50">
                    <CheckIcon className="size-3.5" />
                    {saving ? "Saving…" : "Save & Notify"}
                  </button>
                  <button onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-white/10 text-zinc-400 text-xs py-2.5 hover:text-white hover:border-white/20 transition-all">
                    Discard
                  </button>
                </div>
                <p className="text-xs text-zinc-600 text-center">Guest will receive an update email</p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
