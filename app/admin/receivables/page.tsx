"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, WalletIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Receivable {
  id: string; date: string; description: string; amount: number; type: string; created_at: string
}

const TYPES = [
  { value: "cash",     label: "Cash" },
  { value: "transfer", label: "Bank Transfer" },
  { value: "card",     label: "Card" },
  { value: "other",    label: "Other" },
]

export default function ReceivablesPage() {
  const [items, setItems] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("cash")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    const supabase = createClient()
    supabase.from("receivables").select("*").order("date", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false) })
  }, [])

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

      {/* Add form */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PlusIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Log Receivable</h2>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Walk-in cash payment" required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
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
                    <td className="px-5 py-3 text-zinc-300">{r.description}</td>
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
