"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, ReceiptIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Expense {
  id: string; date: string; phase: string; category: string
  description: string | null; amount: number; created_at: string
}

const CAPEX_CATEGORIES = [
  { value: "renovation",  label: "Renovation & Build-up" },
  { value: "vr_sets",     label: "VR Headsets & Equipment" },
  { value: "vr_guns",     label: "VR Gun Controllers" },
  { value: "furniture",   label: "Furniture & Fixtures" },
  { value: "signage",     label: "Signage & Branding" },
  { value: "other_capex", label: "Other CapEx" },
]

const OPEX_CATEGORIES = [
  { value: "rent",        label: "Rent" },
  { value: "salaries",    label: "Staff Salaries" },
  { value: "electricity", label: "Electricity" },
  { value: "internet",    label: "Internet & Connectivity" },
  { value: "maintenance", label: "Equipment Maintenance" },
  { value: "cleaning",    label: "Cleaning Services" },
  { value: "other_opex",  label: "Other OpEx" },
]

const CATEGORY_MAP = Object.fromEntries(
  [...CAPEX_CATEGORIES, ...OPEX_CATEGORIES].map(c => [c.value, c.label])
)

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [phase, setPhase] = useState<"capex" | "opex">("opex")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const categories = phase === "capex" ? CAPEX_CATEGORIES : OPEX_CATEGORIES

  useEffect(() => {
    const supabase = createClient()
    supabase.from("expenses").select("*").order("date", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => { setExpenses(data ?? []); setLoading(false) })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !amount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("expenses").insert({
      date, phase, category, description: description || null, amount: parseFloat(amount),
    }).select().single()
    if (!error && data) {
      setExpenses(prev => [data, ...prev])
      setCategory(""); setDescription(""); setAmount("")
    }
    setSubmitting(false)
  }

  async function deleteExpense(id: string) {
    const supabase = createClient()
    await supabase.from("expenses").delete().eq("id", id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const capexTotal = expenses.filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
  const opexTotal = expenses.filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Expenses</h1>
        <div className="flex gap-6 mt-2">
          <span className="text-sm text-zinc-500">Total <span className="text-white font-medium">${total.toLocaleString()}</span></span>
          <span className="text-sm text-zinc-500">CapEx <span className="text-amber-400 font-medium">${capexTotal.toLocaleString()}</span></span>
          <span className="text-sm text-zinc-500">OpEx <span className="text-vrz-green font-medium">${opexTotal.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Add expense form */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PlusIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Add Expense</h2>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phase toggle */}
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Phase</label>
            <div className="inline-flex rounded-lg border border-white/10 p-1 gap-1">
              {(["opex", "capex"] as const).map(p => (
                <button key={p} type="button" onClick={() => { setPhase(p); setCategory("") }}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${phase === p ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
                  {p === "capex" ? "CapEx (Pre-launch)" : "OpEx (Operational)"}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors">
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Notes…"
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting}
              className="h-10 px-6 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
              {submitting ? "Saving…" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>

      {/* Expense log */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <ReceiptIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Expense Log</h2>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-600">No expenses recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Phase</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3 text-zinc-400">{format(parseISO(e.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${e.phase === "capex" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-vrz-green/10 text-vrz-green border-vrz-green/20"}`}>
                        {e.phase.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-300">{CATEGORY_MAP[e.category] ?? e.category}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{e.description ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium text-white">${e.amount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteExpense(e.id)}
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
