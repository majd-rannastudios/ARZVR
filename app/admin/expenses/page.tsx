"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import {
  PlusIcon, Trash2Icon, ReceiptIcon, SplitIcon,
  ChevronDownIcon, ChevronUpIcon, CheckIcon, PencilIcon, XIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SplitEntry { name: string; amount: number; reimbursed: boolean }
interface Expense {
  id: string; date: string; phase: string; category: string
  description: string | null; amount: number; created_at: string
  paid_by: string | null; splits: SplitEntry[]
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

const ALL_CATEGORIES = [...CAPEX_CATEGORIES, ...OPEX_CATEGORIES]
const CATEGORY_MAP   = Object.fromEntries(ALL_CATEGORIES.map(c => [c.value, c.label]))

const PARTNERS = [
  { id: "majd",  name: "Majd Farah"   },
  { id: "akl",   name: "Akl Farah"    },
  { id: "elie",  name: "Elie Khoury"  },
  { id: "roy",   name: "Roy Sawma"    },
  { id: "ralph", name: "Ralph Zgheib" },
]

const SELECT_CLS = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT_CLS  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

function isPartner(name: string | null) { return PARTNERS.some(p => p.name === name) }
function firstName(name: string | null) { return name?.split(" ")[0] ?? "—" }

// ─── Form field group (used by both create and edit) ──────────────────────────
interface ExpenseFields {
  phase: "capex" | "opex"; category: string; description: string
  amount: string; date: string; paidBy: string
  isSplit: boolean; splits: { name: string; amount: string }[]
}
const BLANK_FORM: ExpenseFields = {
  phase: "opex", category: "", description: "", amount: "",
  date: format(new Date(), "yyyy-MM-dd"), paidBy: "Organization",
  isSplit: false, splits: [{ name: "", amount: "" }],
}

export default function ExpensesPage() {
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [loading,     setLoading]     = useState(true)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  // Create form
  const [createForm,  setCreateForm]  = useState<ExpenseFields>(BLANK_FORM)
  const [creating,    setCreating]    = useState(false)

  // Edit panel
  const [editTarget,  setEditTarget]  = useState<Expense | null>(null)
  const [editForm,    setEditForm]    = useState<ExpenseFields>(BLANK_FORM)
  const [editSaving,  setEditSaving]  = useState(false)

  useEffect(() => {
    createClient().from("expenses").select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setExpenses((data ?? []).map(e => ({ ...e, splits: e.splits ?? [] })))
        setLoading(false)
      })
  }, [])

  // ── helpers ────────────────────────────────────────────────────────────────
  function setC(k: keyof ExpenseFields, v: unknown) {
    setCreateForm(f => ({ ...f, [k]: v }))
  }
  function setE(k: keyof ExpenseFields, v: unknown) {
    setEditForm(f => ({ ...f, [k]: v }))
  }

  function openEdit(exp: Expense) {
    setEditTarget(exp)
    setEditForm({
      phase:       exp.phase as "capex" | "opex",
      category:    exp.category,
      description: exp.description ?? "",
      amount:      String(exp.amount),
      date:        exp.date,
      paidBy:      exp.paid_by ?? "Organization",
      isSplit:     (exp.splits?.length ?? 0) > 0,
      splits:      exp.splits?.length > 0
                     ? exp.splits.map(s => ({ name: s.name, amount: String(s.amount) }))
                     : [{ name: "", amount: "" }],
    })
  }
  function closeEdit() { setEditTarget(null) }

  // ── injection helper ───────────────────────────────────────────────────────
  async function maybeInject(
    supabase: ReturnType<typeof createClient>,
    paidBy: string, amount: string, date: string, category: string, description: string,
  ) {
    const partner = PARTNERS.find(p => p.name === paidBy)
    if (!partner) return
    const label = [CATEGORY_MAP[category] ?? category, description].filter(Boolean).join(" — ")
    await supabase.from("injections").insert({
      shareholder: partner.id,
      amount:      parseFloat(amount),
      date,
      description: `Expense: ${label}`,
    })
  }

  // ── create ─────────────────────────────────────────────────────────────────
  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const f = createForm
    if (!f.category || !f.amount) return
    setCreating(true)
    const supabase = createClient()

    const splitData: SplitEntry[] = f.isSplit
      ? f.splits.filter(r => r.name || r.amount).map(r => ({
          name: r.name || "Unknown", amount: parseFloat(r.amount) || 0, reimbursed: false,
        }))
      : []

    const { data, error } = await supabase.from("expenses").insert({
      date: f.date, phase: f.phase, category: f.category,
      description: f.description || null,
      amount:  parseFloat(f.amount),
      paid_by: f.isSplit ? null : f.paidBy,
      splits:  splitData,
    }).select().single()

    if (!error && data) {
      setExpenses(prev => [{ ...data, splits: data.splits ?? [] }, ...prev])
      if (!f.isSplit) await maybeInject(supabase, f.paidBy, f.amount, f.date, f.category, f.description)
      setCreateForm(BLANK_FORM)
    }
    setCreating(false)
  }

  // ── update ─────────────────────────────────────────────────────────────────
  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    const f = editForm
    if (!f.category || !f.amount) return
    setEditSaving(true)
    const supabase = createClient()

    const splitData: SplitEntry[] = f.isSplit
      ? f.splits.filter(r => r.name || r.amount).map(r => ({
          name: r.name || "Unknown", amount: parseFloat(r.amount) || 0, reimbursed: false,
        }))
      : []

    const { data, error } = await supabase.from("expenses").update({
      date: f.date, phase: f.phase, category: f.category,
      description: f.description || null,
      amount:  parseFloat(f.amount),
      paid_by: f.isSplit ? null : f.paidBy,
      splits:  splitData,
    }).eq("id", editTarget.id).select().single()

    if (!error && data) {
      setExpenses(prev => prev.map(ex => ex.id === editTarget.id ? { ...data, splits: data.splits ?? [] } : ex))
      // Only inject if paid_by was just switched to a partner (avoid double-counting)
      const wasPartner = isPartner(editTarget.paid_by)
      const nowPartner = !f.isSplit && isPartner(f.paidBy)
      if (nowPartner && !wasPartner) {
        await maybeInject(supabase, f.paidBy, f.amount, f.date, f.category, f.description)
      }
      closeEdit()
    }
    setEditSaving(false)
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  async function deleteExpense(id: string) {
    await createClient().from("expenses").delete().eq("id", id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (editTarget?.id === id) closeEdit()
  }

  async function toggleReimbursed(expense: Expense, splitIdx: number) {
    const updated = expense.splits.map((s, i) =>
      i === splitIdx ? { ...s, reimbursed: !s.reimbursed } : s
    )
    await createClient().from("expenses").update({ splits: updated }).eq("id", expense.id)
    setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, splits: updated } : e))
  }

  const total       = expenses.reduce((s, e) => s + e.amount, 0)
  const capexTotal  = expenses.filter(e => e.phase === "capex").reduce((s, e) => s + e.amount, 0)
  const opexTotal   = expenses.filter(e => e.phase === "opex").reduce((s, e) => s + e.amount, 0)
  const pendingReimb = expenses.flatMap(e => e.splits.filter(s => !s.reimbursed)).reduce((s, sp) => s + sp.amount, 0)

  // ── shared form body (used in both create and edit panels) ─────────────────
  function FormFields({
    f, set, splitTotal, remaining,
  }: {
    f: ExpenseFields
    set: (k: keyof ExpenseFields, v: unknown) => void
    splitTotal: number
    remaining: number
  }) {
    const cats = f.phase === "capex" ? CAPEX_CATEGORIES : OPEX_CATEGORIES
    return (
      <div className="space-y-4">
        {/* Phase */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Phase</label>
          <div className="inline-flex rounded-lg border border-white/10 p-1 gap-1">
            {(["opex", "capex"] as const).map(p => (
              <button key={p} type="button" onClick={() => { set("phase", p); set("category", "") }}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${f.phase === p ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
                {p === "capex" ? "CapEx" : "OpEx"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={f.date} onChange={e => set("date", e.target.value)} required className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={f.category} onChange={e => set("category", e.target.value)} required className={SELECT_CLS}>
              <option value="">Select category…</option>
              {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
            <input type="number" min="0" step="0.01" value={f.amount}
              onChange={e => set("amount", e.target.value)} placeholder="0.00" required className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <input type="text" value={f.description}
              onChange={e => set("description", e.target.value)} placeholder="Notes…" className={INPUT_CLS} />
          </div>
        </div>

        {/* Paid by */}
        {!f.isSplit && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Paid By</label>
            <select value={f.paidBy} onChange={e => set("paidBy", e.target.value)} className={SELECT_CLS}>
              <option value="Organization">Organization (shared wallet)</option>
              {PARTNERS.map(p => (
                <option key={p.id} value={p.name}>{p.name} — auto-injects to equity</option>
              ))}
            </select>
            {isPartner(f.paidBy) && (
              <p className="text-xs text-blue-400 mt-1.5">
                ${f.amount || "0"} will be added to {firstName(f.paidBy)}&apos;s equity injections automatically.
              </p>
            )}
          </div>
        )}

        {/* Split toggle */}
        <div>
          <button type="button" onClick={() => set("isSplit", !f.isSplit)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${f.isSplit ? "border-vrz-green/40 bg-vrz-green/5 text-vrz-green" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"}`}>
            <SplitIcon className="size-3.5" />
            {f.isSplit ? "Split enabled" : "Split between multiple payers"}
          </button>
        </div>

        {/* Split rows */}
        {f.isSplit && (
          <div className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Payers</p>
            {f.splits.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={row.name}
                  onChange={e => set("splits", f.splits.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))}
                  placeholder="Name (or Organization)" className={`${INPUT_CLS} flex-1`} />
                <button type="button"
                  onClick={() => set("splits", f.splits.map((r, idx) => idx === i ? { ...r, name: "Organization" } : r))}
                  className="px-2 h-10 rounded-lg border border-white/10 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all shrink-0">Org</button>
                <input type="number" min="0" step="0.01" value={row.amount}
                  onChange={e => set("splits", f.splits.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))}
                  placeholder="Amount" className={`${INPUT_CLS} w-28`} />
                {f.splits.length > 1 && (
                  <button type="button" onClick={() => set("splits", f.splits.filter((_, idx) => idx !== i))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-600 hover:text-red-400 hover:border-red-500/20 transition-all shrink-0">
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => set("splits", [...f.splits, { name: "", amount: "" }])}
                className="text-xs text-vrz-green hover:text-vrz-green/80 transition-colors flex items-center gap-1">
                <PlusIcon className="size-3" /> Add payer
              </button>
              <span className={`text-xs font-medium ${Math.abs(remaining) < 0.01 ? "text-vrz-green" : "text-orange-400"}`}>
                {Math.abs(remaining) < 0.01 ? "✓ Balanced" : remaining > 0 ? `$${remaining.toFixed(2)} unallocated` : `$${Math.abs(remaining).toFixed(2)} over`}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const cSplitTotal = createForm.splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const cRemaining  = (parseFloat(createForm.amount) || 0) - cSplitTotal
  const eSplitTotal = editForm.splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const eRemaining  = (parseFloat(editForm.amount) || 0) - eSplitTotal

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Expenses</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
          <span className="text-sm text-zinc-500">Total <span className="text-white font-medium">${total.toLocaleString()}</span></span>
          <span className="text-sm text-zinc-500">CapEx <span className="text-amber-400 font-medium">${capexTotal.toLocaleString()}</span></span>
          <span className="text-sm text-zinc-500">OpEx <span className="text-vrz-green font-medium">${opexTotal.toLocaleString()}</span></span>
          {pendingReimb > 0 && (
            <span className="text-sm text-zinc-500">Pending reimbursement <span className="text-orange-400 font-medium">${pendingReimb.toLocaleString()}</span></span>
          )}
        </div>
      </div>

      {/* Add expense form */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PlusIcon className="size-4 text-vrz-green" />
          <h2 className="text-sm font-semibold text-white">Add Expense</h2>
        </div>
        <form onSubmit={submitCreate} className="space-y-4">
          <FormFields f={createForm} set={setC} splitTotal={cSplitTotal} remaining={cRemaining} />
          <button type="submit" disabled={creating}
            className="h-10 px-6 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
            {creating ? "Saving…" : "Add Expense"}
          </button>
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
          <div className="divide-y divide-white/5">
            {expenses.map(e => {
              const isExpanded  = expandedId === e.id
              const hasSplits   = e.splits?.length > 0
              const pendingCount = e.splits?.filter(s => !s.reimbursed).length ?? 0
              return (
                <div key={e.id}>
                  <div
                    className="px-5 py-3 flex items-center gap-3 hover:bg-white/2 transition-colors group"
                    onClick={() => hasSplits && setExpandedId(isExpanded ? null : e.id)}
                    style={{ cursor: hasSplits ? "pointer" : "default" }}
                  >
                    {/* Date */}
                    <span className="text-xs text-zinc-500 w-24 shrink-0">{format(parseISO(e.date), "MMM d, yyyy")}</span>

                    {/* Phase badge */}
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${e.phase === "capex" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-vrz-green/10 text-vrz-green border-vrz-green/20"}`}>
                      {e.phase.toUpperCase()}
                    </span>

                    {/* Category + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{CATEGORY_MAP[e.category] ?? e.category}</p>
                      {e.description && <p className="text-xs text-zinc-600 truncate">{e.description}</p>}
                    </div>

                    {/* Paid by — always visible */}
                    <div className="shrink-0 text-right">
                      {hasSplits ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 text-zinc-400 border border-white/10">
                          <SplitIcon className="size-3" />
                          Split ({e.splits.length})
                          {pendingCount > 0 && <span className="ml-1 text-orange-400">· {pendingCount} pending</span>}
                        </span>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPartner(e.paid_by) ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-zinc-500"}`}>
                          {firstName(e.paid_by)}
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-medium text-white w-20 text-right shrink-0">${e.amount.toLocaleString()}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={ev => ev.stopPropagation()}>
                      {hasSplits && (
                        <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors" onClick={ev => { ev.stopPropagation(); setExpandedId(isExpanded ? null : e.id) }}>
                          {isExpanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                        </span>
                      )}
                      <button onClick={() => openEdit(e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button onClick={() => deleteExpense(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Split breakdown */}
                  {hasSplits && isExpanded && (
                    <div className="px-5 pb-3 bg-white/2 border-t border-white/5">
                      <div className="mt-3 space-y-2">
                        {e.splits.map((sp, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${sp.reimbursed ? "bg-vrz-green" : "bg-orange-400"}`} />
                              <span className="text-sm text-zinc-300">{sp.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${sp.reimbursed ? "bg-vrz-green/10 text-vrz-green border-vrz-green/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                                {sp.reimbursed ? "Reimbursed" : "Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-white">${sp.amount.toLocaleString()}</span>
                              <button onClick={() => toggleReimbursed(e, i)}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${sp.reimbursed ? "border-vrz-green/30 bg-vrz-green/10 text-vrz-green" : "border-white/10 text-zinc-600 hover:border-vrz-green/30 hover:text-vrz-green"}`}
                                title={sp.reimbursed ? "Mark pending" : "Mark reimbursed"}>
                                <CheckIcon className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit slide-over — no backdrop close */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* dim backdrop (click does nothing) */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-white/8 p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
                Edit Expense
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (confirm("Delete this expense?")) deleteExpense(editTarget.id) }}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2Icon className="size-4" />
                </button>
                <button onClick={closeEdit} className="text-zinc-500 hover:text-white transition-colors">
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            <form onSubmit={submitEdit} className="space-y-4">
              <FormFields f={editForm} set={setE} splitTotal={eSplitTotal} remaining={eRemaining} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSaving}
                  className="flex-1 h-10 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={closeEdit}
                  className="px-4 h-10 rounded-lg border border-white/10 text-zinc-400 text-sm hover:text-white transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
