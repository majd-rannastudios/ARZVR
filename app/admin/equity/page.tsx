"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import {
  PlusIcon, Trash2Icon, TrendingUpIcon, TrendingDownIcon,
  WalletIcon, AlertCircleIcon, LayoutListIcon, CheckCircle2Icon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Shareholder config ────────────────────────────────────────────────────────
const SWEAT_DISCOUNT = 0.15

const SHAREHOLDERS = [
  { id: "majd",  name: "Majd Farah",   initials: "MF", color: "#FFBA00", equity: 0.25,  sweat: SWEAT_DISCOUNT },
  { id: "akl",   name: "Akl Farah",    initials: "AF", color: "#00FF7F", equity: 0.25,  sweat: 0 },
  { id: "elie",  name: "Elie Khoury",  initials: "EK", color: "#60a5fa", equity: 0.25,  sweat: 0 },
  { id: "roy",   name: "Roy Sawma",    initials: "RS", color: "#a78bfa", equity: 0.125, sweat: 0 },
  { id: "ralph", name: "Ralph Zgheib", initials: "RZ", color: "#f472b6", equity: 0.125, sweat: 0 },
]

// Adjusted CapEx cash % (Majd −15%, gap absorbed proportionally by others)
function capexSharePct(shId: string): number {
  const sh = SHAREHOLDERS.find(s => s.id === shId)!
  if (sh.sweat > 0) return sh.equity * (1 - sh.sweat)
  const majd = SHAREHOLDERS.find(s => s.sweat > 0)!
  const otherSum = SHAREHOLDERS.filter(s => s.sweat === 0).reduce((s, x) => s + x.equity, 0)
  return sh.equity + (sh.equity / otherSum) * (majd.equity * majd.sweat)
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Injection {
  id: string; shareholder: string; amount: number
  date: string; description: string | null
}

interface BudgetItem {
  id: string; title: string; category: string
  estimated_amount: number; notes: string | null; status: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BUDGET_CATEGORIES = ["Equipment", "Renovation", "Tech", "Furniture", "Licensing", "Other"]
const BUDGET_STATUSES   = ["planned", "approved", "ordered", "paid"] as const
type BudgetStatus = typeof BUDGET_STATUSES[number]

const STATUS_STYLE: Record<BudgetStatus, string> = {
  planned:  "bg-zinc-800 text-zinc-400",
  approved: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  ordered:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  paid:     "bg-vrz-green/10 text-vrz-green border border-vrz-green/20",
}

const SELECT = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }) }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EquityPage() {
  const [injections,   setInjections]   = useState<Injection[]>([])
  const [budgetItems,  setBudgetItems]  = useState<BudgetItem[]>([])
  const [fin,          setFin]          = useState({ capex: 0, opex: 0, revenue: 0 })
  const [loading,      setLoading]      = useState(true)

  // Injection form
  const [injShareholder, setInjShareholder] = useState(SHAREHOLDERS[0].id)
  const [injAmount,      setInjAmount]      = useState("")
  const [injDate,        setInjDate]        = useState(format(new Date(), "yyyy-MM-dd"))
  const [injDesc,        setInjDesc]        = useState("")
  const [injSubmitting,  setInjSubmitting]  = useState(false)

  // Budget form
  const [budTitle,       setBudTitle]       = useState("")
  const [budCategory,    setBudCategory]    = useState(BUDGET_CATEGORIES[0])
  const [budAmount,      setBudAmount]      = useState("")
  const [budNotes,       setBudNotes]       = useState("")
  const [budSubmitting,  setBudSubmitting]  = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const [{ data: inj }, { data: bud }, { data: exp }, { data: bk }, { data: rec }] = await Promise.all([
      supabase.from("injections").select("*").order("date", { ascending: false }),
      supabase.from("budget_items").select("*").order("created_at", { ascending: true }),
      supabase.from("expenses").select("amount, phase"),
      supabase.from("bookings").select("total_price, status"),
      supabase.from("receivables").select("amount"),
    ])
    setInjections(inj ?? [])
    setBudgetItems(bud ?? [])
    const capex   = (exp ?? []).filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
    const opex    = (exp ?? []).filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
    const bookRev = (bk ?? []).filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)
    const recRev  = (rec ?? []).reduce((s, r) => s + r.amount, 0)
    setFin({ capex, opex, revenue: bookRev + recRev })
    setLoading(false)
  }

  async function submitInjection(e: React.FormEvent) {
    e.preventDefault()
    if (!injAmount) return
    setInjSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase.from("injections")
      .insert({ shareholder: injShareholder, amount: parseFloat(injAmount), date: injDate, description: injDesc || null })
      .select().single()
    if (data) setInjections(prev => [data, ...prev])
    setInjAmount(""); setInjDesc("")
    setInjSubmitting(false)
  }

  async function deleteInjection(id: string) {
    const supabase = createClient()
    await supabase.from("injections").delete().eq("id", id)
    setInjections(prev => prev.filter(i => i.id !== id))
  }

  async function submitBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!budAmount || !budTitle) return
    setBudSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase.from("budget_items")
      .insert({ title: budTitle, category: budCategory, estimated_amount: parseFloat(budAmount), notes: budNotes || null })
      .select().single()
    if (data) setBudgetItems(prev => [...prev, data])
    setBudTitle(""); setBudAmount(""); setBudNotes("")
    setBudSubmitting(false)
  }

  async function updateBudgetStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from("budget_items").update({ status }).eq("id", id)
    setBudgetItems(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  async function deleteBudgetItem(id: string) {
    const supabase = createClient()
    await supabase.from("budget_items").delete().eq("id", id)
    setBudgetItems(prev => prev.filter(b => b.id !== id))
  }

  // ─── Derived numbers ────────────────────────────────────────────────────────
  const totalInjected  = injections.reduce((s, i) => s + i.amount, 0)
  const totalExpenses  = fin.capex + fin.opex
  const netPL          = fin.revenue - totalExpenses
  const orgWallet      = totalInjected + fin.revenue - totalExpenses

  const totalBudget    = budgetItems.reduce((s, b) => s + b.estimated_amount, 0)
  const budgetSpent    = fin.capex   // actual CapEx logged
  const budgetLeft     = totalBudget - budgetSpent

  // Per-shareholder injection totals (needed for impliedTotal)
  const injectedBySh = useMemo(() =>
    Object.fromEntries(SHAREHOLDERS.map(sh => [
      sh.id,
      injections.filter(i => i.shareholder === sh.id).reduce((s, i) => s + i.amount, 0),
    ])),
  [injections])

  // The partner who has paid the most relative to their CapEx % sets the benchmark.
  // impliedTotal = that payment ÷ their CapEx % → everyone else's obligation derives from this.
  // e.g. Akl pays $1,750 at 26.04% → implied round = $6,720 → Elie owes $1,750, Roy/Ralph owe $875 each.
  const { impliedTotal, impliedBy } = useMemo(() => {
    let best = { ratio: 0, name: "" }
    for (const sh of SHAREHOLDERS) {
      const ratio = injectedBySh[sh.id] / capexSharePct(sh.id)
      if (ratio > best.ratio) best = { ratio, name: sh.name }
    }
    return { impliedTotal: best.ratio, impliedBy: best.name }
  }, [injectedBySh])

  const stats = useMemo(() => SHAREHOLDERS.map(sh => {
    const capexPct         = capexSharePct(sh.id)
    const injected         = injectedBySh[sh.id]
    const obligation       = impliedTotal * capexPct      // what they owe, based on the highest payer
    const balance          = injected - obligation         // positive = ahead, negative = still owes
    const budgetObligation = totalBudget * capexPct       // forward-looking: full budget share
    const stillToGo        = Math.max(0, budgetObligation - injected)
    const profitShare      = netPL > 0 ? netPL * sh.equity : 0
    return { ...sh, capexPct, obligation, injected, balance, budgetObligation, stillToGo, profitShare }
  }), [injectedBySh, impliedTotal, totalBudget, netPL])

  const stillNeeded = stats.reduce((s, sh) => s + Math.max(0, -sh.balance), 0)

  if (loading) return <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Equity</h1>
        <p className="text-sm text-zinc-500 mt-1">Organisation wallet · capital positions · budget tracker</p>
      </div>

      {/* ── Org Wallet ── hero */}
      <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center gap-5 ${
        orgWallet >= 0 ? "border-vrz-green/20 bg-vrz-green/5" : "border-red-500/20 bg-red-500/5"
      }`}>
        <WalletIcon className={`size-9 shrink-0 ${orgWallet >= 0 ? "text-vrz-green" : "text-red-400"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Organisation Wallet</p>
          <p className={`font-heading text-5xl ${orgWallet >= 0 ? "text-vrz-green" : "text-red-400"}`}
            style={{ fontFamily: "var(--font-heading)" }}>
            {orgWallet < 0 ? "−" : ""}${fmt(Math.abs(orgWallet))}
          </p>
          <p className="text-xs text-zinc-600 mt-1.5">
            ${fmt(totalInjected)} injected + ${fmt(fin.revenue)} revenue − ${fmt(totalExpenses)} expenses
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          {stillNeeded > 0.5 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <AlertCircleIcon className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">Partners owe</p>
                <p className="text-sm font-semibold text-amber-400">${fmt(stillNeeded)}</p>
              </div>
            </div>
          )}
          {budgetLeft > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <LayoutListIcon className="size-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">Budget remaining</p>
                <p className="text-sm font-semibold text-blue-400">${fmt(budgetLeft)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: "Total Injected", value: totalInjected, color: "text-vrz-green",  sign: "" },
          { label: "Total Budget",   value: totalBudget,   color: "text-zinc-300",   sign: "" },
          { label: "Budget Spent",   value: budgetSpent,   color: "text-zinc-300",   sign: "" },
          { label: "Net P&L",        value: netPL,         color: netPL >= 0 ? "text-vrz-green" : "text-red-400", sign: netPL >= 0 ? "+" : "−" },
        ] as const).map(({ label, value, color, sign }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/2 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-heading text-2xl ${color}`} style={{ fontFamily: "var(--font-heading)" }}>
              {sign}${fmt(Math.abs(value))}
            </p>
          </div>
        ))}
      </div>

      {/* ══ BUDGET TRACKER ══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Budget Tracker</h2>
          {totalBudget > 0 && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-vrz-green rounded-full transition-all"
                  style={{ width: `${Math.min(100, (budgetSpent / totalBudget) * 100)}%` }} />
              </div>
              <span className="text-xs text-zinc-500 shrink-0">
                ${fmt(budgetSpent)} / ${fmt(totalBudget)} spent
              </span>
            </div>
          )}
        </div>

        {/* Budget items list */}
        {budgetItems.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                    <th className="px-5 py-3 text-left">Item</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Estimate</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {budgetItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="text-zinc-200">{item.title}</p>
                        {item.notes && <p className="text-xs text-zinc-600 mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 text-xs">{item.category}</td>
                      <td className="px-5 py-3 text-right font-medium text-zinc-300">${fmt(item.estimated_amount)}</td>
                      <td className="px-5 py-3 text-center">
                        <select
                          value={item.status}
                          onChange={e => updateBudgetStatus(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${STATUS_STYLE[item.status as BudgetStatus] ?? STATUS_STYLE.planned}`}
                        >
                          {BUDGET_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => deleteBudgetItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/2 border-t-2 border-white/10 font-medium">
                    <td className="px-5 py-3 text-zinc-300" colSpan={2}>Total Budget</td>
                    <td className="px-5 py-3 text-right text-zinc-200">${fmt(totalBudget)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Add budget item form */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlusIcon className="size-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Add Budget Item</span>
          </div>
          <form onSubmit={submitBudget} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input type="text" value={budTitle} onChange={e => setBudTitle(e.target.value)}
                placeholder="Item name (e.g. VR Headsets × 6)" required className={INPUT} />
            </div>
            <div>
              <select value={budCategory} onChange={e => setBudCategory(e.target.value)} className={SELECT}>
                {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <input type="number" min="0" step="0.01" value={budAmount} onChange={e => setBudAmount(e.target.value)}
                placeholder="Estimated amount ($)" required className={INPUT} />
            </div>
            <div>
              <input type="text" value={budNotes} onChange={e => setBudNotes(e.target.value)}
                placeholder="Notes (optional)" className={INPUT} />
            </div>
            <div>
              <button type="submit" disabled={budSubmitting}
                className="h-10 w-full px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all disabled:opacity-50">
                {budSubmitting ? "Adding…" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ══ CAPITAL CONTRIBUTIONS ══ */}
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Capital Contributions</h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              {impliedTotal > 0
                ? `${impliedBy}'s payment sets the bar — implies a $${fmt(impliedTotal)} total round. Everyone else's obligation is their CapEx % of that.`
                : "No injections yet. The first payment will set the implied total round for all partners."}
              {totalBudget > 0 && ` "Still to go" shows remaining obligation toward the $${fmt(totalBudget)} budget.`}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {stats.map(sh => {
            const pct     = sh.obligation > 0 ? Math.min(100, (sh.injected / sh.obligation) * 100) : (sh.injected > 0 ? 100 : 0)
            const settled = Math.abs(sh.balance) <= 0.5
            const ahead   = sh.balance > 0.5
            return (
              <div key={sh.id} className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0"
                    style={{ background: sh.color }}>
                    {sh.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{sh.name}</p>
                    <p className="text-xs text-zinc-500">{(sh.equity * 100).toFixed(1)}% equity · {(sh.capexPct * 100).toFixed(2)}% CapEx</p>
                  </div>
                  {sh.sweat > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      sweat −{(sh.sweat * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Progress vs current pool */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-500">Fair share of pool</span>
                    <span className="text-zinc-400">${fmt(sh.obligation)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sh.color }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-zinc-600">Injected ${fmt(sh.injected)}</span>
                    <span className={ahead ? "text-vrz-green" : settled ? "text-zinc-500" : "text-red-400 font-medium"}>
                      {ahead   ? `+$${fmt(sh.balance)} ahead`           :
                       settled ? <span className="flex items-center gap-1"><CheckCircle2Icon className="size-3" />Even</span> :
                                 `$${fmt(Math.abs(sh.balance))} behind`}
                    </span>
                  </div>
                </div>

                {/* Budget target */}
                {totalBudget > 0 && (
                  <div className="border-t border-white/5 pt-3 flex justify-between text-xs">
                    <span className="text-zinc-500">Budget obligation</span>
                    <span className="text-zinc-400">${fmt(sh.budgetObligation)}</span>
                  </div>
                )}
                {totalBudget > 0 && sh.stillToGo > 0.5 && (
                  <div className="flex justify-between text-xs -mt-2">
                    <span className="text-zinc-600">Still to go</span>
                    <span className="text-blue-400">${fmt(sh.stillToGo)}</span>
                  </div>
                )}

                {/* Profit share */}
                <div className="border-t border-white/5 pt-3 flex justify-between text-xs">
                  <span className="text-zinc-500">Profit share</span>
                  <span className={netPL > 0 ? "text-vrz-green font-medium" : "text-zinc-600"}>
                    {netPL > 0 ? `+$${fmt(sh.profitShare)}` : "—"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Full table */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <TrendingDownIcon className="size-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Contribution Table</h2>
            <span className="ml-auto text-xs text-zinc-600">Implied round: ${fmt(impliedTotal)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Shareholder</th>
                  <th className="px-5 py-3 text-right">CapEx %</th>
                  <th className="px-5 py-3 text-right">Fair Share</th>
                  <th className="px-5 py-3 text-right">Injected</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  {totalBudget > 0 && <th className="px-5 py-3 text-right">Still to Go</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.map(sh => (
                  <tr key={sh.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sh.color }} />
                        <span className="text-zinc-200">{sh.name}</span>
                        {sh.sweat > 0 && <span className="text-[10px] text-amber-400/70">sweat</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400">{(sh.capexPct * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3 text-right text-zinc-300">${fmt(sh.obligation)}</td>
                    <td className="px-5 py-3 text-right text-zinc-300">${fmt(sh.injected)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${
                      sh.balance > 0.5 ? "text-vrz-green" : sh.balance < -0.5 ? "text-red-400" : "text-zinc-500"
                    }`}>
                      {sh.balance > 0.5   ? `+$${fmt(sh.balance)}`          :
                       sh.balance < -0.5  ? `−$${fmt(Math.abs(sh.balance))}` : "—"}
                    </td>
                    {totalBudget > 0 && (
                      <td className={`px-5 py-3 text-right ${sh.stillToGo > 0.5 ? "text-blue-400" : "text-zinc-600"}`}>
                        {sh.stillToGo > 0.5 ? `$${fmt(sh.stillToGo)}` : "—"}
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="bg-white/2 font-medium border-t-2 border-white/10">
                  <td className="px-5 py-3 text-zinc-300">Total</td>
                  <td className="px-5 py-3 text-right text-zinc-400">100%</td>
                  <td className="px-5 py-3 text-right text-zinc-200">${fmt(impliedTotal)}</td>
                  <td className="px-5 py-3 text-right text-zinc-200">${fmt(totalInjected)}</td>
                  <td className={`px-5 py-3 text-right ${totalInjected >= impliedTotal - 0.5 ? "text-vrz-green" : "text-red-400"}`}>
                    {totalInjected >= impliedTotal - 0.5 ? "—" : `−$${fmt(impliedTotal - totalInjected)}`}
                  </td>
                  {totalBudget > 0 && (
                    <td className={`px-5 py-3 text-right ${totalBudget > totalInjected ? "text-blue-400" : "text-vrz-green"}`}>
                      {totalBudget > totalInjected ? `$${fmt(totalBudget - totalInjected)}` : "Funded ✓"}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Profit distribution ── */}
      {netPL > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <TrendingUpIcon className="size-4 text-vrz-green" />
            <h2 className="text-sm font-semibold text-white">Profit Distribution</h2>
            <span className="ml-auto text-xs text-zinc-600">Distributable: ${fmt(netPL)}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                <th className="px-5 py-3 text-left">Shareholder</th>
                <th className="px-5 py-3 text-right">Equity %</th>
                <th className="px-5 py-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.map(sh => (
                <tr key={sh.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sh.color }} />
                      <span className="text-zinc-200">{sh.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500">{(sh.equity * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right font-medium text-vrz-green">+${fmt(sh.profitShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Log injection ── */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PlusIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Log Capital Injection</h2>
        </div>
        <form onSubmit={submitInjection} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Shareholder</label>
            <select value={injShareholder} onChange={e => setInjShareholder(e.target.value)} className={SELECT}>
              {SHAREHOLDERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount ($)</label>
            <input type="number" min="0" step="0.01" value={injAmount} onChange={e => setInjAmount(e.target.value)}
              placeholder="0.00" required className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={injDate} onChange={e => setInjDate(e.target.value)} required className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
            <input type="text" value={injDesc} onChange={e => setInjDesc(e.target.value)}
              placeholder="e.g. Round 1 contribution" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={injSubmitting}
              className="h-10 px-6 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
              {injSubmitting ? "Saving…" : "Log Injection"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Injection log ── */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Injection Log</h2>
        </div>
        {injections.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-600">No injections logged yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Shareholder</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {injections.map(inj => {
                  const sh = SHAREHOLDERS.find(s => s.id === inj.shareholder)
                  return (
                    <tr key={inj.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">{format(parseISO(inj.date), "MMM d, yyyy")}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sh?.color ?? "#888" }} />
                          <span className="text-zinc-300">{sh?.name ?? inj.shareholder}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">{inj.description ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-medium text-vrz-green whitespace-nowrap">${inj.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => deleteInjection(inj.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
