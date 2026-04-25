"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ZapIcon, MailIcon, LockIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/admin")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span
            className="font-heading text-5xl tracking-widest text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            VRZ
          </span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ZapIcon className="size-3 text-vrz-green" />
            <span className="text-xs uppercase tracking-widest text-zinc-500">Admin Portal</span>
            <ZapIcon className="size-3 text-vrz-green" />
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/8 bg-white/2 p-8 flex flex-col gap-5"
        >
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Email</label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vrz.lb"
                required
                className="w-full h-11 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5 block">Password</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-vrz-green transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50 shadow-[0_0_20px_#00FF7F20]"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
