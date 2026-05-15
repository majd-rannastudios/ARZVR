import { createClient } from "@/lib/supabase/server"
import { format, addDays, parseISO, isPast, isToday } from "date-fns"
import Link from "next/link"
import {
  WalletIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon,
  AlertTriangleIcon, CheckCircle2Icon, ClockIcon, ArrowRightIcon,
  UsersIcon, BarChart3Icon, ZapIcon, CircleIcon,
} from "lucide-react"

// ── Shareholders ──────────────────────────────────────────────────────────────
const SHAREHOLDERS = [
  { id: "majd",  name: "Majd Farah",   initials: "MF", color: "#FFBA00", equity: 0.25,  sweat: 0.15 },
  { id: "akl",   name: "Akl Farah",    initials: "AF", color: "#00FF7F", equity: 0.25,  sweat: 0    },
  { id: "elie",  name: "Elie Khoury",  initials: "EK", color: "#60a5fa", equity: 0.25,  sweat: 0    },
  { id: "roy",   name: "Roy Sawma",    initials: "RS", color: "#a78bfa", equity: 0.125, sweat: 0    },
  { id: "ralph", name: "Ralph Zgheib", initials: "RZ", color: "#f472b6", equity: 0.125, sweat: 0    },
]

function capexSharePct(shId: string): number {
  const sh = SHAREHOLDERS.find(s => s.id === shId)!
  if (sh.sweat > 0) return sh.equity * (1 - sh.sweat)
  const majd    = SHAREHOLDERS.find(s => s.sweat > 0)!
  const otherSum = SHAREHOLDERS.filter(s => s.sweat === 0).reduce((s, x) => s + x.equity, 0)
  return sh.equity + (sh.equity / otherSum) * (majd.equity * majd.sweat)
}

const PRIORITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-400", high: "bg-orange-400", medium: "bg-vrz-amber", low: "bg-zinc-500",
}
const PRIORITY_TEXT: Record<string, string> = {
  critical: "text-red-400", high: "text-orange-400", medium: "text-vrz-amber", low: "text-zinc-500",
}
const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", blocked: "Blocked", done: "Done",
}
const STATUS_COLOR: Record<string, string> = {
  open: "text-zinc-400", in_progress: "text-vrz-amber", blocked: "text-red-400", done: "text-vrz-green",
}

const CATEGORY_LABELS: Record<string, string> = {
  renovation: "Renovation", vr_sets: "VR Headsets", vr_guns: "VR Guns",
  furniture: "Furniture", signage: "Signage", other_capex: "Other CapEx",
  rent: "Rent", salaries: "Salaries", electricity: "Electricity",
  internet: "Internet", maintenance: "Maintenance", cleaning: "Cleaning", other_opex: "Other OpEx",
}

function $ (n: number) { return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }

export default async function AdminOverviewPage() {
  const supabase   = await createClient()
  const today      = new Date()
  const todayStr   = format(today, "yyyy-MM-dd")
  const weekEndStr = format(addDays(today, 7), "yyyy-MM-dd")
  const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd")
  const monthEnd   = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd")

  const [
    { data: injections   },
    { data: expenses     },
    { data: allBk        },
    { data: allRecv      },
    { data: budgetItems  },
    { data: activeActions},
    { data: todayBk      },
    { data: weekBk       },
    { data: monthBk      },
  ] = await Promise.all([
    supabase.from("injections").select("*").order("date",       { ascending: false }),
    supabase.from("expenses")  .select("*").order("date",       { ascending: false }),
    supabase.from("bookings")  .select("total_price, status").neq("status", "cancelled"),
    supabase.from("receivables").select("amount"),
    supabase.from("budget_items").select("*"),
    supabase.from("actions").select("*").neq("status", "done").order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").eq("date", todayStr).neq("status", "cancelled").order("start_time"),
    supabase.from("bookings").select("*").gt("date", todayStr).lte("date", weekEndStr).neq("status", "cancelled").order("date").order("start_time"),
    supabase.from("bookings").select("total_price").gte("date", monthStart).lte("date", monthEnd).neq("status", "cancelled"),
  ])

  // ── Financial ─────────────────────────────────────────────────────────────
  const totalInjected = (injections ?? []).reduce((s, i) => s + i.amount, 0)
  const totalBkRev    = (allBk      ?? []).reduce((s, b) => s + b.total_price, 0)
  const totalRecvRev  = (allRecv    ?? []).reduce((s, r) => s + r.amount, 0)
  const totalRevenue  = totalBkRev + totalRecvRev
  const totalCapex    = (expenses ?? []).filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
  const totalOpex     = (expenses ?? []).filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
  const totalExpenses = totalCapex + totalOpex
  const orgWallet     = totalInjected + totalRevenue - totalExpenses

  const monthRevenue  = (monthBk   ?? []).reduce((s, b) => s + b.total_price, 0)
  const monthExpenses = (expenses  ?? [])
    .filter(e => e.date >= monthStart && e.date <= monthEnd)
    .reduce((s, e) => s + e.amount, 0)
  const monthNetPL    = monthRevenue - monthExpenses

  // ── Equity ────────────────────────────────────────────────────────────────
  const injectedBySh: Record<string, number> = Object.fromEntries(
    SHAREHOLDERS.map(sh => [
      sh.id,
      (injections ?? []).filter(i => i.shareholder === sh.id).reduce((s, i) => s + i.amount, 0),
    ])
  )
  let impliedTotal = 0
  for (const sh of SHAREHOLDERS.filter(s => s.sweat === 0)) {
    const ratio = injectedBySh[sh.id] / capexSharePct(sh.id)
    if (ratio > impliedTotal) impliedTotal = ratio
  }
  const partnerStats = SHAREHOLDERS.map(sh => {
    const pct        = capexSharePct(sh.id)
    const injected   = injectedBySh[sh.id]
    const obligation = impliedTotal * pct
    const balance    = injected - obligation
    const progress   = obligation > 0 ? Math.min(injected / obligation, 1) : (injected > 0 ? 1 : 0)
    return { ...sh, pct, injected, obligation, balance, progress }
  })

  // ── Actions ───────────────────────────────────────────────────────────────
  const sortedActions = [...(activeActions ?? [])].sort(
    (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
  )
  const blockedCount  = sortedActions.filter(a => a.status === "blocked").length
  const overdueActions = sortedActions.filter(a =>
    a.due_date && isPast(parseISO(a.due_date)) && a.status !== "done"
  )
  const topActions = sortedActions.slice(0, 6)

  // ── Budget ────────────────────────────────────────────────────────────────
  const bud = { planned: 0, approved: 0, ordered: 0, paid: 0 }
  const budCount = { planned: 0, approved: 0, ordered: 0, paid: 0 }
  ;(budgetItems ?? []).forEach(b => {
    if (b.status in bud) {
      bud[b.status as keyof typeof bud] += b.estimated_amount
      budCount[b.status as keyof typeof budCount]++
    }
  })
  const totalBudget  = Object.values(bud).reduce((s, v) => s + v, 0)
  const budCommitted = bud.approved + bud.ordered + bud.paid

  // ── Today / Week ──────────────────────────────────────────────────────────
  const todayRevenue = (todayBk ?? []).reduce((s, b) => s + b.total_price, 0)
  const recentExp    = (expenses ?? []).slice(0, 8)

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-vrz-amber/10 text-vrz-amber border border-vrz-amber/20">
              <ZapIcon className="size-3" /> Pre-Launch · Building Phase
            </span>
          </div>
          <p className="text-sm text-zinc-500">{format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>
        {/* Quick pills */}
        <div className="flex flex-wrap gap-2">
          {(todayBk ?? []).length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vrz-green/10 border border-vrz-green/20 text-vrz-green text-xs font-medium">
              <CalendarIcon className="size-3" /> {(todayBk ?? []).length} booking{(todayBk ?? []).length > 1 ? "s" : ""} today
            </span>
          )}
          {blockedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertTriangleIcon className="size-3" /> {blockedCount} blocked
            </span>
          )}
          {overdueActions.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
              <ClockIcon className="size-3" /> {overdueActions.length} overdue
            </span>
          )}
        </div>
      </div>

      {/* ── Org Wallet Hero ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/3 to-transparent p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: wallet total */}
          <div className="shrink-0">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <WalletIcon className="size-3.5" /> Org Wallet — Cash on Hand
            </p>
            <p className={`font-heading text-5xl font-bold ${orgWallet >= 0 ? "text-vrz-green" : "text-red-400"}`}
              style={{ fontFamily: "var(--font-heading)" }}>
              {$(orgWallet)}
            </p>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-16 bg-white/10" />

          {/* Right: formula */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-0.5">Capital In</p>
              <p className="text-xl font-semibold text-blue-400">{$(totalInjected)}</p>
              <p className="text-xs text-zinc-700 mt-0.5">partner injections</p>
            </div>
            <span className="text-zinc-600 text-lg font-light">+</span>
            <div className="text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-0.5">Revenue</p>
              <p className="text-xl font-semibold text-vrz-green">{$(totalRevenue)}</p>
              <p className="text-xs text-zinc-700 mt-0.5">bookings + other</p>
            </div>
            <span className="text-zinc-600 text-lg font-light">−</span>
            <div className="text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-0.5">Spent</p>
              <p className="text-xl font-semibold text-red-400">{$(totalExpenses)}</p>
              <p className="text-xs text-zinc-700 mt-0.5">capex + opex</p>
            </div>
            <span className="text-zinc-600 text-lg font-light">=</span>
            <div className="text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-0.5">Balance</p>
              <p className={`text-xl font-semibold ${orgWallet >= 0 ? "text-vrz-green" : "text-red-400"}`}>{$(orgWallet)}</p>
              <p className="text-xs text-zinc-700 mt-0.5">available</p>
            </div>
          </div>

          {/* Right KPIs */}
          <div className="hidden xl:flex flex-col gap-3 shrink-0 pl-4 border-l border-white/8">
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider">Month Revenue</p>
              <p className="text-lg font-semibold text-white">{$(monthRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider">Month Net P&L</p>
              <p className={`text-lg font-semibold ${monthNetPL >= 0 ? "text-vrz-green" : "text-red-400"}`}>
                {monthNetPL >= 0 ? "+" : "−"}{$(Math.abs(monthNetPL))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Grid: Partner Equity | Today | Actions ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Partner Equity */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-vrz-green" />
              <h2 className="text-sm font-semibold text-white">Partner Equity</h2>
            </div>
            <Link href="/admin/equity" className="text-xs text-zinc-600 hover:text-vrz-green transition-colors flex items-center gap-1">
              Full view <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {partnerStats.map(sh => {
              const canSurplus = sh.sweat > 0
              const settled    = sh.balance >= -0.5
              const ahead      = canSurplus && sh.balance > 0.5
              return (
                <div key={sh.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-black shrink-0"
                      style={{ backgroundColor: sh.color }}>
                      {sh.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-zinc-200 font-medium truncate">{sh.name}</p>
                        <span className={`text-xs font-medium shrink-0 ${
                          ahead ? "text-vrz-green" : settled ? "text-zinc-500" : "text-red-400"
                        }`}>
                          {ahead   ? `+${$(sh.balance)}`
                           : settled ? "Settled"
                           : `-${$(Math.abs(sh.balance))}`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">{$(sh.injected)} injected · {Math.round(sh.pct * 100 * 100) / 100}% CapEx</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ahead ? "bg-vrz-green" : settled ? "bg-zinc-500" : "bg-red-400/60"}`}
                      style={{ width: `${sh.progress * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {impliedTotal === 0 && (
            <p className="px-5 pb-4 text-xs text-zinc-700">No injections recorded yet — equity obligations will appear once partners start contributing.</p>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-vrz-green" />
              <h2 className="text-sm font-semibold text-white">
                Today
                {(todayBk ?? []).length > 0 && (
                  <span className="ml-2 text-xs text-vrz-green font-normal">{$(todayRevenue)}</span>
                )}
              </h2>
            </div>
            <Link href="/admin/reservations" className="text-xs text-zinc-600 hover:text-vrz-green transition-colors flex items-center gap-1">
              All <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          {(todayBk ?? []).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-5 text-center">
              <CalendarIcon className="size-8 text-zinc-800 mb-3" />
              <p className="text-sm text-zinc-600">No bookings today</p>
              {(weekBk ?? []).length > 0 && (
                <p className="text-xs text-zinc-700 mt-1">
                  Next: {format(parseISO((weekBk ?? [])[0].date), "EEE MMM d")} — {(weekBk ?? [])[0].name}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(todayBk ?? []).map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xs font-mono text-vrz-green">{b.start_time?.slice(0, 5)}</p>
                    <p className="text-xs text-zinc-700">{b.end_time?.slice(0, 5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate font-medium">{b.name}</p>
                    <p className="text-xs text-zinc-600">
                      {b.session_type === "private" ? "Private" : `${b.machine_count}× Single`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-vrz-green shrink-0">${b.total_price}</span>
                </div>
              ))}
            </div>
          )}
          {/* This week */}
          {(weekBk ?? []).length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 bg-white/1">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Next 7 Days</p>
              <div className="space-y-1.5">
                {(weekBk ?? []).slice(0, 4).map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{format(parseISO(b.date), "EEE d")}</span>
                    <span className="text-zinc-400 truncate mx-2 flex-1">{b.name}</span>
                    <span className="text-zinc-500 shrink-0">{b.start_time?.slice(0, 5)}</span>
                  </div>
                ))}
                {(weekBk ?? []).length > 4 && (
                  <p className="text-xs text-zinc-700">+{(weekBk ?? []).length - 4} more this week</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Priority Actions */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZapIcon className="size-4 text-vrz-green" />
              <h2 className="text-sm font-semibold text-white">Actions</h2>
              {sortedActions.length > 0 && (
                <span className="text-xs text-zinc-600">{sortedActions.length} open</span>
              )}
            </div>
            <Link href="/admin/actions" className="text-xs text-zinc-600 hover:text-vrz-green transition-colors flex items-center gap-1">
              All <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          {topActions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-5 text-center">
              <CheckCircle2Icon className="size-8 text-vrz-green/40 mb-3" />
              <p className="text-sm text-zinc-600">All actions complete</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 flex-1">
              {topActions.map(a => {
                const overdue = a.due_date && isPast(parseISO(a.due_date))
                return (
                  <div key={a.id} className="px-5 py-3 flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[a.priority] ?? "bg-zinc-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${a.status === "blocked" ? "text-red-300" : "text-zinc-200"} line-clamp-2`}>
                        {a.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-medium ${STATUS_COLOR[a.status] ?? "text-zinc-400"}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                        {a.owner && <span className="text-xs text-zinc-600">· {a.owner}</span>}
                        {a.due_date && (
                          <span className={`text-xs ${overdue ? "text-red-400" : "text-zinc-600"}`}>
                            {overdue ? "⚠ " : ""}{format(parseISO(a.due_date), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Budget Pipeline | Recent Expenses ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budget Pipeline */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="size-4 text-vrz-green" />
              <h2 className="text-sm font-semibold text-white">Build Budget</h2>
              {totalBudget > 0 && <span className="text-xs text-zinc-600">{$(totalBudget)} planned</span>}
            </div>
            <Link href="/admin/equity" className="text-xs text-zinc-600 hover:text-vrz-green transition-colors flex items-center gap-1">
              Manage <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          {totalBudget === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-600">No budget items added yet</div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Pipeline stages */}
              <div className="grid grid-cols-4 gap-2">
                {([
                  { key: "planned",  label: "Planned",  color: "text-zinc-400",  bg: "bg-zinc-800",       border: "border-zinc-700" },
                  { key: "approved", label: "Approved", color: "text-blue-400",  bg: "bg-blue-500/10",    border: "border-blue-500/20" },
                  { key: "ordered",  label: "Ordered",  color: "text-vrz-amber", bg: "bg-vrz-amber/10",   border: "border-vrz-amber/20" },
                  { key: "paid",     label: "Paid",     color: "text-vrz-green", bg: "bg-vrz-green/10",   border: "border-vrz-green/20" },
                ] as const).map(({ key, label, color, bg, border }) => (
                  <div key={key} className={`rounded-lg ${bg} border ${border} p-3 text-center`}>
                    <p className={`text-xs font-medium ${color} uppercase tracking-wider`}>{label}</p>
                    <p className={`text-base font-bold ${color} mt-1`}>{$(bud[key])}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{budCount[key]} item{budCount[key] !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar: planned → paid */}
              <div>
                <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                  <span>Procurement progress</span>
                  <span>{$(bud.paid)} of {$(totalBudget)} paid</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                  {bud.paid     > 0 && <div className="bg-vrz-green h-full"   style={{ width: `${(bud.paid     / totalBudget) * 100}%` }} />}
                  {bud.ordered  > 0 && <div className="bg-vrz-amber h-full"   style={{ width: `${(bud.ordered  / totalBudget) * 100}%` }} />}
                  {bud.approved > 0 && <div className="bg-blue-400 h-full"    style={{ width: `${(bud.approved / totalBudget) * 100}%` }} />}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {[
                    { color: "bg-vrz-green", label: "Paid" },
                    { color: "bg-vrz-amber", label: "Ordered" },
                    { color: "bg-blue-400",  label: "Approved" },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1 text-xs text-zinc-600">
                      <span className={`w-2 h-2 rounded-sm ${color}`} /> {label}
                    </span>
                  ))}
                  <span className="text-xs text-zinc-700 ml-auto">
                    {$(budCommitted)} committed ({totalBudget > 0 ? Math.round(budCommitted / totalBudget * 100) : 0}%)
                  </span>
                </div>
              </div>

              {/* CapEx: budget vs actual */}
              <div className="rounded-lg border border-white/8 bg-black/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-wider">Actual CapEx Spent</p>
                  <p className="text-lg font-semibold text-amber-400 mt-0.5">{$(totalCapex)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider">vs Budget</p>
                  <p className={`text-lg font-semibold mt-0.5 ${totalCapex > totalBudget ? "text-red-400" : "text-zinc-400"}`}>
                    {$(totalBudget)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider">Remaining</p>
                  <p className={`text-lg font-semibold mt-0.5 ${totalBudget - totalCapex >= 0 ? "text-vrz-green" : "text-red-400"}`}>
                    {$(Math.abs(totalBudget - totalCapex))}
                    {totalCapex > totalBudget ? " over" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDownIcon className="size-4 text-vrz-green" />
              <h2 className="text-sm font-semibold text-white">Recent Expenses</h2>
            </div>
            <Link href="/admin/expenses" className="text-xs text-zinc-600 hover:text-vrz-green transition-colors flex items-center gap-1">
              All <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          {recentExp.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-600">No expenses recorded</div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {recentExp.map(e => {
                  const partner = SHAREHOLDERS.find(s => s.name === e.paid_by)
                  return (
                    <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                      {/* Payer badge */}
                      <div className="shrink-0">
                        {partner ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
                            style={{ backgroundColor: partner.color }}>
                            {partner.initials}
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-xs text-zinc-500">
                            Org
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{CATEGORY_LABELS[e.category] ?? e.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${e.phase === "capex" ? "bg-amber-500/10 text-amber-400" : "bg-vrz-green/10 text-vrz-green"}`}>
                            {e.phase.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-600">{format(parseISO(e.date), "MMM d")}</span>
                          {e.description && <span className="text-xs text-zinc-700 truncate">{e.description}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-white shrink-0">${e.amount.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
              {/* Summary row */}
              <div className="px-5 py-3 border-t border-white/5 bg-white/1 flex justify-between text-xs text-zinc-600">
                <span>All time: <span className="text-white font-medium">{$(totalExpenses)}</span></span>
                <span>CapEx <span className="text-amber-400">{$(totalCapex)}</span> · OpEx <span className="text-vrz-green">{$(totalOpex)}</span></span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
