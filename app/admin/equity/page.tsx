"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Shareholder config ───────────────────────────────────────────────────────
const SWEAT_DISCOUNT = 0.15   // Majd's sweat equity discount on CapEx

const SHAREHOLDERS = [
  { id: "majd",  name: "Majd Farah",   initials: "MF", color: "#FFBA00", equity: 0.25,   sweat: SWEAT_DISCOUNT },
  { id: "akl",   name: "Akl Farah",    initials: "AF", color: "#00FF7F", equity: 0.25,   sweat: 0 },
  { id: "elie",  name: "Elie Khoury",  initials: "EK", color: "#60a5fa", equity: 0.25,   sweat: 0 },
  { id: "roy",   name: "Roy Sawma",    initials: "RS", color: "#a78bfa", equity: 0.125,  sweat: 0 },
  { id: "ralph", name: "Ralph Zgheib", initials: "RZ", color: "#f472b6", equity: 0.125,  sweat: 0 },
]

// CapEx cash contribution % (after sweat redistribution)
function capexSharePct(shId: string): number {
  const sh = SHAREHOLDERS.find(s => s.id === shId)!
  if (sh.sweat > 0) return sh.equity * (1 - sh.sweat)           // Majd: 25% × 0.85 = 21.25%
  const majd = SHAREHOLDERS.find(s => s.sweat > 0)!
  const otherEquitySum = SHAREHOLDERS.filter(s => s.sweat === 0).reduce((s, x) => s + x.equity, 0)
  const sweatGap = majd.equity * majd.sweat                       // 3.75%
  const absorbed = (sh.equity / otherEquitySum) * sweatGap
  return sh.equity + absorbed
}

interface Injection {
  id: string; shareholder: string; amount: number
  date: string; description: string | null; created_at: string
}

const SELECT = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

export default function EquityPage() {
  const [injections,  setInjections]  = useState<Injection[]>([])
  const [totalCapex,  setTotalCapex]  = useState(0)
  const [netPL,       setNetPL]       = useState(0)
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

    const capex = (exp ?? []).filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
    const opex  = (exp ?? []).filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
    const bookRev = (bk ?? []).filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0)
    const recRev  = (rec ?? []).reduce((s, r) => s + r.amount, 0)
    const totalRev = bookRev + recRev
    setTotalCapex(capex)
    setNetPL(totalRev - opex - capex)
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

  // Per-shareholder aggregates
  const stats = useMemo(() => SHAREHOLDERS.map(sh => {
    const capexPct    = capexSharePct(sh.id)
    const capexTarget = totalCapex * capexPct
    const injected    = injections.filter(i => i.shareholder === sh.id).reduce((s, i) => s + i.amount, 0)
    const capexBalance = injected - capexTarget          // positive = overpaid, negative = still owes
    const profitShare  = netPL > 0 ? netPL * sh.equity : 0
    return { ...sh, capexPct, capexTarget, injected, capexBalance, profitShare }
  }), [injections, totalCapex, netPL])

  const totalInjected = injections.reduce((s, i) => s + i.amount, 0)

  if (loading) return <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Equity</h1>
        <p className="text-sm text-zinc-500 mt-1">Capital injections, CapEx obligations & profit distribution</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total CapEx",      value: `$${totalCapex.toLocaleString()}`,   green: false },
          { label: "Total Injected",   value: `$${totalInjected.toLocaleString()}`, green: true  },
          { label: "CapEx Gap",        value: `$${Math.max(0, totalCapex - totalInjected).toLocaleString()}`, green: false },
          { label: "Distributable P&L",value: `${netPL >= 0 ? "+" : ""}$${netPL.toLocaleString()}`, green: netPL >= 0 },
        ].map(({ label, value, green }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/2 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-heading text-2xl ${green ? "text-vrz-green" : "text-white"}`} style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Shareholder cards */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Shareholder Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map(sh => {
            const pct = sh.capexTarget > 0 ? Math.min(100, (sh.injected / sh.capexTarget) * 100) : 100
            const over = sh.capexBalance > 0
            const under = sh.capexBalance < 0
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
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-vrz-amber/10 text-vrz-amber border border-vrz-amber/20">
                      sweat −{(sh.sweat * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* CapEx obligation */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">CapEx share ({(sh.capexPct * 100).toFixed(2)}%)</span>
                    <span className="text-zinc-400">${sh.capexTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sh.color }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-zinc-600">Injected: ${sh.injected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={over ? "text-vrz-green" : under ? "text-red-400" : "text-zinc-500"}>
                      {over ? `+$${sh.capexBalance.toFixed(0)} ahead` : under ? `-$${Math.abs(sh.capexBalance).toFixed(0)} owed` : "Settled"}
                    </span>
                  </div>
                </div>

                {/* Profit share */}
                <div className="border-t border-white/5 pt-3 flex justify-between text-xs">
                  <span className="text-zinc-500">Profit share</span>
                  <span className={netPL >= 0 ? "text-vrz-green font-medium" : "text-red-400"}>
                    {netPL >= 0 ? `+$${sh.profitShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "N/A"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CapEx distribution table */}
      <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <TrendingDownIcon className="size-4 text-vrz-amber" />
          <h2 className="text-sm font-semibold text-white">CapEx Obligations</h2>
          <span className="ml-auto text-xs text-zinc-600">Total: ${totalCapex.toLocaleString()}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5">
              <th className="px-5 py-3 text-left">Shareholder</th>
              <th className="px-5 py-3 text-right">Equity %</th>
              <th className="px-5 py-3 text-right">CapEx %</th>
              <th className="px-5 py-3 text-right">Owes</th>
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
                    {sh.sweat > 0 && <span className="text-xs text-vrz-amber">sweat</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-zinc-400">{(sh.equity * 100).toFixed(1)}%</td>
                <td className="px-5 py-3 text-right text-zinc-300">{(sh.capexPct * 100).toFixed(2)}%</td>
                <td className="px-5 py-3 text-right text-zinc-300">${sh.capexTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-5 py-3 text-right text-zinc-300">${sh.injected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className={`px-5 py-3 text-right font-medium ${sh.capexBalance > 0 ? "text-vrz-green" : sh.capexBalance < 0 ? "text-red-400" : "text-zinc-500"}`}>
                  {sh.capexBalance > 0 ? `+$${sh.capexBalance.toFixed(0)}` : sh.capexBalance < 0 ? `-$${Math.abs(sh.capexBalance).toFixed(0)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profit distribution table */}
      {netPL > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <TrendingUpIcon className="size-4 text-vrz-green" />
            <h2 className="text-sm font-semibold text-white">Profit Distribution</h2>
            <span className="ml-auto text-xs text-zinc-600">Net P&L: ${netPL.toLocaleString()}</span>
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
                  <td className="px-5 py-3 text-right text-zinc-400">{(sh.equity * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right font-medium text-vrz-green">+${sh.profitShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log injection form */}
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
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
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

      {/* Injection log */}
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
                      <td className="px-5 py-3 text-zinc-400">{format(parseISO(inj.date), "MMM d, yyyy")}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sh?.color ?? "#888" }} />
                          <span className="text-zinc-300">{sh?.name ?? inj.shareholder}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">{inj.description ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-medium text-vrz-green">${inj.amount.toLocaleString()}</td>
                      <td className="px-5 py-3">
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
