"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, Trash2Icon, ClipboardListIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
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

const STATUSES = [
  { value: "open",        label: "Open",        color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
  { value: "in_progress", label: "In Progress", color: "text-vrz-amber bg-vrz-amber/10 border-vrz-amber/20" },
  { value: "blocked",     label: "Blocked",     color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { value: "done",        label: "Done",        color: "text-vrz-green bg-vrz-green/10 border-vrz-green/20" },
]

const PRIORITIES = [
  { value: "low",      label: "Low",      color: "text-zinc-500" },
  { value: "medium",   label: "Medium",   color: "text-vrz-amber" },
  { value: "high",     label: "High",     color: "text-orange-400" },
  { value: "critical", label: "Critical", color: "text-red-400" },
]

const SELECT = "w-full h-10 px-3 rounded-lg bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-vrz-green transition-colors"
const INPUT  = "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"

function statusCfg(v: string) { return STATUSES.find(s => s.value === v) ?? STATUSES[0] }
function priorityCfg(v: string) { return PRIORITIES.find(p => p.value === v) ?? PRIORITIES[1] }

export default function ActionsPage() {
  const [actions, setActions]     = useState<Action[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")

  // Form
  const [title, setTitle]           = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate]       = useState("")
  const [status, setStatus]         = useState("open")
  const [owner, setOwner]           = useState("")
  const [priority, setPriority]     = useState("medium")
  const [notes, setNotes]           = useState("")
  const [showForm, setShowForm]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from("actions")
      .select("*")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false })
    setActions(data ?? [])
    setLoading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("actions").insert({
      title,
      description: description || null,
      due_date: dueDate || null,
      status,
      owner: owner || null,
      priority,
      notes: notes || null,
    }).select().single()
    if (!error && data) {
      setActions(prev => [data, ...prev])
      setTitle(""); setDescription(""); setDueDate(""); setStatus("open")
      setOwner(""); setPriority("medium"); setNotes("")
      setShowForm(false)
    }
    setSubmitting(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    const supabase = createClient()
    await supabase.from("actions").update({ status: newStatus }).eq("id", id)
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  async function deleteAction(id: string) {
    const supabase = createClient()
    await supabase.from("actions").delete().eq("id", id)
    setActions(prev => prev.filter(a => a.id !== id))
  }

  const filtered = filterStatus === "all" ? actions : actions.filter(a => a.status === filterStatus)
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
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all shrink-0">
          <PlusIcon className="size-4" />
          New Action
        </button>
      </div>

      {/* New action form */}
      {showForm && (
        <div className="rounded-xl border border-vrz-green/20 bg-vrz-green/[0.02] p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardListIcon className="size-4 text-vrz-green" />
            <h2 className="text-sm font-semibold text-white">New Action</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" required className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="More context…" className={INPUT} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={SELECT}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={SELECT}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Owner</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Who's responsible?" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes…" rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-5 h-10 rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50">
                {submitting ? "Saving…" : "Add Action"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 h-10 rounded-lg border border-white/10 text-zinc-400 text-sm hover:text-white transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg border border-white/8 w-fit">
        {[{ value: "all", label: `All (${actions.length})` }, ...STATUSES.map(s => ({ value: s.value, label: `${s.label} (${counts[s.value as keyof typeof counts]})` }))].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatus === f.value ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Actions list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-600">No actions{filterStatus !== "all" ? " with this status" : ""}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const sc = statusCfg(a.status)
            const pc = priorityCfg(a.priority)
            const expanded = expandedId === a.id
            const overdue = a.due_date && a.status !== "done" && new Date(a.due_date) < new Date()

            return (
              <div key={a.id} className={`rounded-xl border bg-white/2 transition-all ${expanded ? "border-white/15" : "border-white/8"}`}>
                {/* Row */}
                <div className="px-5 py-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expanded ? null : a.id)}>
                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${pc.color.replace("text-", "bg-")}`} />

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${a.status === "done" ? "line-through text-zinc-600" : "text-zinc-200"}`}>{a.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {a.owner && <span className="text-xs text-zinc-600">{a.owner}</span>}
                      {a.due_date && (
                        <span className={`text-xs ${overdue ? "text-red-400" : "text-zinc-600"}`}>
                          {overdue ? "Overdue · " : ""}{format(parseISO(a.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority label */}
                  <span className={`text-xs font-medium hidden sm:block ${pc.color}`}>{pc.label}</span>

                  {/* Status badge */}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border shrink-0 ${sc.color}`}>{sc.label}</span>

                  {/* Expand chevron */}
                  <div className="text-zinc-600 shrink-0">
                    {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                    {a.description && <p className="text-sm text-zinc-400">{a.description}</p>}
                    {a.notes && (
                      <div className="bg-white/3 rounded-lg p-3">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{a.notes}</p>
                      </div>
                    )}

                    {/* Status changer */}
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.filter(s => s.value !== a.status).map(s => (
                        <button key={s.value} onClick={() => updateStatus(a.id, s.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 ${s.color}`}>
                          → {s.label}
                        </button>
                      ))}
                      <button onClick={() => deleteAction(a.id)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                        <Trash2Icon className="size-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
