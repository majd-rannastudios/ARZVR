"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import {
  PlusIcon, Trash2Icon, PencilIcon, XIcon, CheckIcon,
  ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Action {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
  owner: string | null
  priority: string
  notes: string | null
  created_at: string
}

type SortField = "priority" | "due_date" | "status" | "title" | "created_at"

const STATUSES = [
  { value: "open",        label: "Open",        color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
  { value: "in_progress", label: "In Progress", color: "text-vrz-amber bg-vrz-amber/10 border-vrz-amber/20" },
  { value: "blocked",     label: "Blocked",     color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { value: "done",        label: "Done",        color: "text-vrz-green bg-vrz-green/10 border-vrz-green/20" },
]

const PRIORITIES = [
  { value: "low",      label: "Low",      dot: "bg-zinc-500",   text: "text-zinc-500"  },
  { value: "medium",   label: "Medium",   dot: "bg-vrz-amber",  text: "text-vrz-amber" },
  { value: "high",     label: "High",     dot: "bg-orange-400", text: "text-orange-400"},
  { value: "critical", label: "Critical", dot: "bg-red-400",    text: "text-red-400"   },
]
const PRIORITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
const STATUS_RANK:   Record<string, number> = { open: 1, in_progress: 2, blocked: 3, done: 4 }

const sCfg = (v: string) => STATUSES.find(s => s.value === v)   ?? STATUSES[0]
const pCfg = (v: string) => PRIORITIES.find(p => p.value === v) ?? PRIORITIES[1]

const SELECT   = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT    = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"
const TEXTAREA = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors resize-none"

const BLANK = { title: "", description: "", due_date: "", status: "open", owner: "", priority: "medium", notes: "" }

export default function ActionsPage() {
  const [actions, setActions]       = useState<Action[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState<Action | null>(null)
  const [form, setForm]             = useState(BLANK)

  // Filters
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterOwner,    setFilterOwner]    = useState("all")

  // Sort
  const [sortField, setSortField] = useState<SortField>("priority")
  const [sortAsc,   setSortAsc]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from("actions").select("*").order("created_at", { ascending: false })
    setActions(data ?? [])
    setLoading(false)
  }

  // Unique owners from existing actions (for datalist)
  const ownerOptions = useMemo(
    () => [...new Set(actions.map(a => a.owner).filter(Boolean) as string[])].sort(),
    [actions]
  )

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function openCreate() {
    setForm(BLANK)
    setEditTarget(null)
    setShowForm(true)
  }

  function openEdit(a: Action) {
    setForm({
      title:       a.title,
      description: a.description ?? "",
      due_date:    a.due_date ?? "",
      status:      a.status,
      owner:       a.owner ?? "",
      priority:    a.priority,
      notes:       a.notes ?? "",
    })
    setEditTarget(a)
    setShowForm(true)
  }

  function closePanel() { setShowForm(false); setEditTarget(null) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      due_date:    form.due_date || null,
      status:      form.status,
      owner:       form.owner.trim() || null,
      priority:    form.priority,
      notes:       form.notes.trim() || null,
    }
    if (editTarget) {
      const { data } = await supabase.from("actions").update(payload).eq("id", editTarget.id).select().single()
      if (data) setActions(prev => prev.map(a => a.id === editTarget.id ? data : a))
    } else {
      const { data } = await supabase.from("actions").insert(payload).select().single()
      if (data) setActions(prev => [data, ...prev])
    }
    setSaving(false)
    closePanel()
  }

  async function quickStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from("actions").update({ status }).eq("id", id)
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function deleteAction(id: string) {
    const supabase = createClient()
    await supabase.from("actions").delete().eq("id", id)
    setActions(prev => prev.filter(a => a.id !== id))
    if (editTarget?.id === id) closePanel()
  }

  // Filter + sort
  const displayed = useMemo(() => {
    let list = actions
    if (filterStatus   !== "all") list = list.filter(a => a.status === filterStatus)
    if (filterPriority !== "all") list = list.filter(a => a.priority === filterPriority)
    if (filterOwner    !== "all") list = list.filter(a => a.owner === filterOwner)

    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === "priority")   cmp = (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0)
      if (sortField === "status")     cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0)
      if (sortField === "title")      cmp = a.title.localeCompare(b.title)
      if (sortField === "created_at") cmp = a.created_at.localeCompare(b.created_at)
      if (sortField === "due_date") {
        const da = a.due_date ?? "9999"
        const db = b.due_date ?? "9999"
        cmp = da.localeCompare(db)
      }
      return sortAsc ? cmp : -cmp
    })
  }, [actions, filterStatus, filterPriority, filterOwner, sortField, sortAsc])

  function toggleSort(f: SortField) {
    if (sortField === f) setSortAsc(v => !v)
    else { setSortField(f); setSortAsc(false) }
  }

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field
    const Icon = active ? (sortAsc ? ArrowUpIcon : ArrowDownIcon) : ArrowUpDownIcon
    return (
      <button onClick={() => toggleSort(field)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "border-vrz-green/30 bg-vrz-green/10 text-vrz-green" : "border-white/10 text-zinc-500 hover:text-white hover:border-white/20"}`}>
        {label} <Icon className="size-3" />
      </button>
    )
  }

  const counts = { open: 0, in_progress: 0, blocked: 0, done: 0 }
  actions.forEach(a => { if (a.status in counts) counts[a.status as keyof typeof counts]++ })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-heading text-3xl text-white" style={{ fontFamily: "var(--font-heading)" }}>Actions</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {counts.open} open · {counts.in_progress} in progress · {counts.blocked} blocked · {counts.done} done
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all shrink-0">
          <PlusIcon className="size-4" /> New Action
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <div className="flex gap-1 p-1 rounded-lg border border-white/8">
          {[{ value: "all", label: "All" }, ...STATUSES].map(s => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filterStatus === s.value ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
              {s.label}{s.value !== "all" ? ` (${counts[s.value as keyof typeof counts]})` : ` (${actions.length})`}
            </button>
          ))}
        </div>

        {/* Priority */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-vrz-green transition-colors">
          <option value="all">All priorities</option>
          {PRIORITIES.slice().reverse().map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        {/* Owner */}
        {ownerOptions.length > 0 && (
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}
            className="h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-vrz-green transition-colors">
            <option value="all">All owners</option>
            {ownerOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-600">Sort:</span>
        <SortBtn field="priority"   label="Priority" />
        <SortBtn field="due_date"   label="Due date" />
        <SortBtn field="status"     label="Status" />
        <SortBtn field="title"      label="Title" />
        <SortBtn field="created_at" label="Created" />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-600">No actions match the current filters</div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-600 uppercase tracking-wider border-b border-white/5 bg-white/2">
                <th className="px-5 py-3 text-left w-3" />
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Owner</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Due</th>
                <th className="px-5 py-3 text-left">Priority</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayed.map(a => {
                const sc = sCfg(a.status)
                const pc = pCfg(a.priority)
                const overdue = a.due_date && a.status !== "done" && new Date(a.due_date) < new Date()
                return (
                  <tr key={a.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3">
                      <div className={`w-2 h-2 rounded-full ${pc.dot}`} />
                    </td>
                    <td className="px-5 py-3 max-w-[240px]">
                      <p className={`font-medium truncate ${a.status === "done" ? "line-through text-zinc-600" : "text-zinc-200"}`}>{a.title}</p>
                      {a.description && <p className="text-xs text-zinc-600 truncate mt-0.5">{a.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 hidden md:table-cell">{a.owner ?? <span className="text-zinc-700">—</span>}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {a.due_date
                        ? <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-zinc-500"}`}>{overdue ? "⚠ " : ""}{format(parseISO(a.due_date), "MMM d")}</span>
                        : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${pc.text}`}>{pc.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <select value={a.status} onChange={e => quickStatus(a.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none ${sc.color}`}>
                        {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-zinc-950 text-white">{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => openEdit(a)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
                        <PencilIcon className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closePanel}>
          <div className="w-full max-w-md bg-black border-l border-white/8 p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
                {editTarget ? "Edit Action" : "New Action"}
              </h2>
              <div className="flex items-center gap-2">
                {editTarget && (
                  <button onClick={() => deleteAction(editTarget.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2Icon className="size-4" />
                  </button>
                )}
                <button onClick={closePanel} className="text-zinc-500 hover:text-white transition-colors">
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => setField("title", e.target.value)}
                  placeholder="What needs to be done?" required className={INPUT} />
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <input value={form.description} onChange={e => setField("description", e.target.value)}
                  placeholder="More context…" className={INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setField("priority", e.target.value)} className={SELECT}>
                    {PRIORITIES.slice().reverse().map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setField("status", e.target.value)} className={SELECT}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setField("due_date", e.target.value)} className={INPUT} />
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Owner</label>
                <input
                  list="owners-list"
                  value={form.owner}
                  onChange={e => setField("owner", e.target.value)}
                  placeholder="Who's responsible?"
                  className={INPUT}
                />
                <datalist id="owners-list">
                  {ownerOptions.map(o => <option key={o} value={o} />)}
                </datalist>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
                  placeholder="Additional notes…" rows={4} className={TEXTAREA} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
                  <CheckIcon className="size-4" />
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Action"}
                </button>
                <button type="button" onClick={closePanel}
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
