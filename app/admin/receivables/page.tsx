"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, WalletIcon, ClockIcon, CheckCircleIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Receivable {
  id: string; date: string; description: string; amount: number; type: string; created_at: string; booking_id?: string | null
}

interface PendingBooking {
  id: string; name: string; date: string; total_price: number; session_type: string; machine_count: number; start_time: string
}

const TYPES = [
  { value: "cash",     label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "card",     label: "Card" },
  { value: "other",    label: "Other" },
]

const SELECT_CLS = "h-9 px-2 rounded-lg bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-vrz-green transition-colors"
const INPUT_CLS  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

export default function ReceivablesPage() {
  const [items, setItems]           = useState<Receivable[]>([])
  const [pending, setPending]       = useState<PendingBooking[]>([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loggingId, setLoggingId]   = useState<string | null>(null)
  const [pendingTypes, setPendingTypes] = useState<Record<string, string>>({})

  // Manual form
  const [description, setDescription] = useState("")
  const [amount, setAmount]           = useState("")
  const [type, setType]               = useState("cash")
  const [date, setDate]               = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const today = format(new Date(), "yyyy-MM-dd")

    const [{ data: receivables }, { data: bookings }] = await Promise.all([
      supabase.from("receivables").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("bookings")
        .select("id, name, date, total_price, session_type, machine_count, start_time")
        .neq("status", "cancelled")
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(50),
    ])

    const loggedIds = new Set(
      (receivables ?? []).filter(r => r.booking_id).map(r => r.booking_id as string)
    )
    const unlogged = (bookings ?? []).filter(b => !loggedIds.has(b.id))

    setItems(receivables ?? [])
    setPending(unlogged)
    setLoading(false)
  }

  async function logFromBooking(booking: PendingBooking) {
    setLoggingId(booking.id)
    const payType = pendingTypes[booking.id] ?? "cash"
    const supabase = createClient()
    const desc = booking.session_type === "private"
      ? `Private session — ${booking.name}`
      : `${booking.machine_count}× Single — ${booking.name}`
    const { data, error } = await supabase.from("receivables")
      .insert({ date: booking.date, description: desc, amount: booking.total_price, type: payType, booking_id: booking.id })
      .select().single()
    if (!error && data) {
      setItems(prev => [data, ...prev])
      setPending(prev => prev.filter(b => b.id !== booking.id))
    }
    setLoggingId(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("receivables")
      .insert({ date, description, amount: parseFloat(amount), type }).select().single()
    if (!error && data) {
      setItems(prev => [data, ...prev])
      setDescription(""); setAmount(""); setType("cash")
    }
    setSubmitting(false)
  }

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from("receivables").delete().eq("id", id)
    setItems(prev => prev.filter(r => r.id !== id))
  }

  const total = items.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Receivables</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Total logged: <span className="text-vrz-green font-medium">${total.toLocaleString()}</span>
        </p>
      </div>

      {/* Pending booking payments */}
      {!loading && pending.length > 0 && (
        <div className="rounded-xl border border-vrz-green/25 bg-vrz-green/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-vrz-green/10 flex items-center gap-2">
            <ClockIcon className="size-4 text-vrz-green" />
            <h2 className="text-sm font-semibold text-white">Pending Payments</h2>
            <span className="ml-auto text-xs text-zinc-500">
              {pending.length} booking{pending.length > 1 ? "s" : ""} not yet logged
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {pending.map(b => (
              <div key={b.id} className="px-5 py-3.5 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{b.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {format(parseISO(b.date), "EEE, MMM d")} · {b.start_time} · {b.session_type === "private" ? "Private" : `${b.machine_count}× Single`}
                  </p>
                </div>
                <span className="text-sm font-bold text-vrz-green shrink-0">${b.total_price.toLocaleString()}</span>
                <select
                  value={pendingTypes[b.id] ?? "cash"}
                  onChange={e => setPendingTypes(prev => ({ ...prev, [b.id]: e.target.value }))}
                  className={SELECT_CLS}
                >
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button
                  onClick={() => logFromBooking(b)}
                  disabled={loggingId === b.id}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-vrz-green text-black text-xs font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50 shrink-0"
                >
                  <CheckCircleIcon className="size-3.5" />
                  {loggingId === b.id ? "Logging…" : "Log Payment"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual add form */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PlusIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Log Receivable</h2>
          <span className="ml-auto text-xs text-zinc-600">manual entry</span>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Walk-in cash" required className={INPUT_CLS} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting}
              className="h-10 px-6 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
              {submitting ? "Saving…" : "Log Receivable"}
            </button>
          </div>
        </form>
      </div>

      {/* Log */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <WalletIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Receivables Log</h2>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-600">No receivables logged yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(r => (
                  <tr key={r.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3 text-zinc-400">{format(parseISO(r.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-zinc-300">
                      <span>{r.description}</span>
                      {r.booking_id && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] bg-vrz-green/10 text-vrz-green border border-vrz-green/20">booking</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-white/5 text-zinc-400 border border-white/10">{r.type}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-vrz-green">${r.amount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteItem(r.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
