"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, TrendingUpIcon, TrendingDownIcon, WalletIcon, AlertCircleIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Shareholder config ────────────────────────────────────────────────────────
const SWEAT_DISCOUNT = 0.15   // Majd's CapEx cash discount

const SHAREHOLDERS = [
  { id: "majd",  name: "Majd Farah",   initials: "MF", color: "#FFBA00", equity: 0.25,  sweat: SWEAT_DISCOUNT },
  { id: "akl",   name: "Akl Farah",    initials: "AF", color: "#00FF7F", equity: 0.25,  sweat: 0 },
  { id: "elie",  name: "Elie Khoury",  initials: "EK", color: "#60a5fa", equity: 0.25,  sweat: 0 },
  { id: "roy",   name: "Roy Sawma",    initials: "RS", color: "#a78bfa", equity: 0.125, sweat: 0 },
  { id: "ralph", name: "Ralph Zgheib", initials: "RZ", color: "#f472b6", equity: 0.125, sweat: 0 },
]

// Adjusted CapEx cash contribution % (Majd −15%, gap absorbed by others proportionally)
function capexSharePct(shId: string): number {
  const sh = SHAREHOLDERS.find(s => s.id === shId)!
  if (sh.sweat > 0) return sh.equity * (1 - sh.sweat)                     // 25% × 0.85 = 21.25%
  const majd = SHAREHOLDERS.find(s => s.sweat > 0)!
  const otherSum = SHAREHOLDERS.filter(s => s.sweat === 0).reduce((s, x) => s + x.equity, 0)
  const gap = majd.equity * majd.sweat                                      // 3.75% redistributed
  return sh.equity + (sh.equity / otherSum) * gap
}

interface Injection {
  id: string; shareholder: string; amount: number
  date: string; description: string | null
}

const SELECT = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function EquityPage() {
  const [injections,  setInjections]  = useState<Injection[]>([])
  const [fin,         setFin]         = useState({ capex: 0, opex: 0, revenue: 0 })
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)

  const [shareholder, setShareholder] = useState(SHAREHOLDERS[0].id)
  const [amount,      setAmount]      = useState("")
  const [date,        setDate]        = useState(format(new Date(), "yyyy-MM-dd"))
  const [description, setDescription] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const [{ data: inj }, { data: exp }, { data: bk }, { data: rec }] = await Promise.all([
      supabase.from("injections").select("*").order("date", { ascending: false }),
      supabase.from("expenses").select("amount, phase"),
      supabase.from("bookings").select("total_price, status"),
      supabase.from("receivables").select("amount"),
    ])
    setInjections(inj ?? [])
    const capex   = (exp ?? []).filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
    const opex    = (exp ?? []).filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
    const bookRev = (bk ?? []).filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)
    const recRev  = (rec ?? []).reduce((s, r) => s + r.amount, 0)
    setFin({ capex, opex, revenue: bookRev + recRev })
    setLoading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase.from("injections")
      .insert({ shareholder, amount: parseFloat(amount), date, description: description || null })
      .select().single()
    if (data) setInjections(prev => [data, ...prev])
    setAmount(""); setDescription("")
    setSubmitting(false)
  }

  async function deleteInj(id: string) {
    const supabase = createClient()
    await supabase.from("injections").delete().eq("id", id)
    setInjections(prev => prev.filter(i => i.id !== id))
  }

  const totalExpenses  = fin.capex + fin.opex
  const netPL          = fin.revenue - totalExpenses
  const totalInjected  = injections.reduce((s, i) => s + i.amount, 0)
  const orgWallet      = totalInjected + fin.revenue - totalExpenses

  const stats = useMemo(() => SHAREHOLDERS.map(sh => {
    const capexPct   = capexSharePct(sh.id)
    const obligation = fin.capex * capexPct
    const injected   = injections.filter(i => i.shareholder === sh.id).reduce((s, i) => s + i.amount, 0)
    const balance    = injected - obligation   // positive = ahead, negative = still owed
    const profitShare = netPL > 0 ? netPL * sh.equity : 0
    return { ...sh, capexPct, obligation, injected, balance, profitShare }
  }), [injections, fin.capex, netPL])

  const stillNeeded = stats.reduce((s, sh) => s + Math.max(0, -sh.balance), 0)

  if (loading) return <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Equity</h1>
        <p className="text-sm text-zinc-500 mt-1">Organisation wallet · capital obligations · profit distribution</p>
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
        {stillNeeded > 0.5 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 shrink-0">
            <AlertCircleIcon className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Partners still owe</p>
              <p className="text-base font-semibold text-amber-400">${fmt(stillNeeded)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Financial summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: "Revenue",  value: fin.revenue,   color: "text-vrz-green", prefix: "" },
          { label: "OpEx",     value: fin.opex,      color: "text-zinc-300",  prefix: "" },
          { label: "CapEx",    value: fin.capex,     color: "text-zinc-300",  prefix: "" },
          { label: "Net P&L",  value: netPL,         color: netPL >= 0 ? "text-vrz-green" : "text-red-400", prefix: netPL >= 0 ? "+" : "−" },
        ] as const).map(({ label, value, color, prefix }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/2 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-heading text-2xl ${color}`} style={{ fontFamily: "var(--font-heading)" }}>
              {prefix}${fmt(Math.abs(value))}
            </p>
          </div>
        ))}
      </div>

      {/* ── Shareholder cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Shareholder Positions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map(sh => {
            const pct     = sh.obligation > 0 ? Math.min(100, (sh.injected / sh.obligation) * 100) : 100
            const settled = Math.abs(sh.balance) <= 0.5
            const ahead   = sh.balance > 0.5
            return (
              <div key={sh.id} className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
                {/* Identity */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0"
                    style={{ background: sh.color }}>
                    {sh.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{sh.name}</p>
                    <p className="text-xs text-zinc-500">{(sh.equity * 100).toFixed(1)}% equity</p>
                  </div>
                  {sh.sweat > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      sweat −{(sh.sweat * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* CapEx progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-500">CapEx ({(sh.capexPct * 100).toFixed(2)}%)</span>
                    <span className="text-zinc-400">${fmt(sh.obligation)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sh.color }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-zinc-600">Injected ${fmt(sh.injected)}</span>
                    <span className={ahead ? "text-vrz-green" : settled ? "text-zinc-500" : "text-red-400"}>
                      {ahead   ? `+$${fmt(sh.balance)} ahead`       :
                       settled ? "Settled ✓"                        :
                                 `$${fmt(Math.abs(sh.balance))} needed`}
                    </span>
                  </div>
                </div>

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
      </div>

      {/* ── CapEx obligations table ── */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <TrendingDownIcon className="size-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">CapEx Obligations</h2>
          <span className="ml-auto text-xs text-zinc-600">Total CapEx: ${fmt(fin.capex)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
                <th className="px-5 py-3 text-left">Shareholder</th>
                <th className="px-5 py-3 text-right">Equity %</th>
                <th className="px-5 py-3 text-right">CapEx %</th>
                <th className="px-5 py-3 text-right">Obligation</th>
                <th className="px-5 py-3 text-right">Injected</th>
                <th className="px-5 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.map(sh => (
                <tr key={sh.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sh.color }} />
                      <span className="text-zinc-200">{sh.name}</span>
                      {sh.sweat > 0 && <span className="text-[10px] text-amber-400/70 ml-0.5">sweat</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500">{(sh.equity * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right text-zinc-400">{(sh.capexPct * 100).toFixed(2)}%</td>
                  <td className="px-5 py-3 text-right text-zinc-300">${fmt(sh.obligation)}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">${fmt(sh.injected)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${
                    sh.balance > 0.5 ? "text-vrz-green" : sh.balance < -0.5 ? "text-red-400" : "text-zinc-500"
                  }`}>
                    {sh.balance > 0.5   ? `+$${fmt(sh.balance)}`         :
                     sh.balance < -0.5  ? `−$${fmt(Math.abs(sh.balance))}` : "—"}
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-white/2 font-medium border-t-2 border-white/10">
                <td className="px-5 py-3 text-zinc-300" colSpan={3}>Total</td>
                <td className="px-5 py-3 text-right text-zinc-200">${fmt(fin.capex)}</td>
                <td className="px-5 py-3 text-right text-zinc-200">${fmt(totalInjected)}</td>
                <td className={`px-5 py-3 text-right ${totalInjected - fin.capex >= -0.5 ? "text-vrz-green" : "text-red-400"}`}>
                  {totalInjected >= fin.capex
                    ? `+$${fmt(totalInjected - fin.capex)}`
                    : `−$${fmt(fin.capex - totalInjected)}`}
                </td>
              </tr>
            </tbody>
          </table>
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
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Shareholder</label>
            <select value={shareholder} onChange={e => setShareholder(e.target.value)} className={SELECT}>
              {SHAREHOLDERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount ($)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" required className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Initial CapEx contribution" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting}
              className="h-10 px-6 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
              {submitting ? "Saving…" : "Log Injection"}
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
                        <button onClick={() => deleteInj(inj.id)}
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
