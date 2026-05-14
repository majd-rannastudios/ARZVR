"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ZapIcon, MailIcon, LockIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") === "auth_failed") {
      setError("This account isn't registered. Contact your admin to get access.")
    }
  }, [])

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

  async function signInWithGoogle() {
    setError("")
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success Supabase redirects the browser — no manual push needed
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-heading text-5xl tracking-widest text-white" style={{ fontFamily: "var(--font-heading)" }}>
            VRZ
          </span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ZapIcon className="size-3 text-vrz-green" />
            <span className="text-xs uppercase tracking-widest text-zinc-500">Admin Portal</span>
            <ZapIcon className="size-3 text-vrz-green" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/2 p-8 flex flex-col gap-5">
          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            className="flex items-center justify-center gap-3 h-11 w-full rounded-lg bg-white text-zinc-800 text-sm font-semibold hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email / password form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="h-11 w-full rounded-lg bg-vrz-green text-black text-sm font-bold hover:bg-vrz-green/90 transition-all disabled:opacity-50 shadow-[0_0_20px_#00FF7F20]"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
