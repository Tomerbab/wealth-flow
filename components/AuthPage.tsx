'use client'

import { useState } from 'react'
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Mode = 'signin' | 'signup'

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'אימייל או סיסמה שגויים'
  if (msg.includes('Email not confirmed'))         return 'האימייל טרם אושר — בדוק את תיבת הדואר'
  if (msg.includes('User already registered'))    return 'כתובת אימייל זו כבר רשומה במערכת'
  if (msg.includes('Password should be'))         return 'הסיסמה חייבת להכיל לפחות 6 תווים'
  if (msg.includes('Unable to validate email'))   return 'כתובת אימייל אינה תקינה'
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit'))
    return 'יותר מדי ניסיונות — נסה שוב עוד מעט'
  return msg
}

export default function AuthPage() {
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('נשלח אימייל אישור — בדוק את תיבת הדואר שלך כדי להשלים את ההרשמה')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // onAuthStateChange in useAuth will pick up the new session automatically
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'שגיאה לא ידועה'
      setError(translateError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/60 mb-4">
            <TrendingUp size={30} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl tracking-tight">WealthFlow</h1>
          <p className="text-slate-500 text-sm mt-1">ניהול הון אישי חכם</p>
        </div>

        {/* ── Mode toggle ── */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'signin' ? 'כניסה לחשבון' : 'הרשמה'}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              כתובת אימייל
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-sm transition-colors text-left"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              סיסמה
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={mode === 'signup' ? 'לפחות 6 תווים' : '••••••••'}
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 pr-10 pl-10 focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-sm transition-colors text-left"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-4 py-3">
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> מעבד...</>
            ) : mode === 'signin' ? (
              'כניסה לחשבון'
            ) : (
              'יצירת חשבון'
            )}
          </button>
        </form>

        <p className="text-slate-700 text-xs text-center mt-6">
          הנתונים שלך מאובטחים ומוצפנים
        </p>
      </div>
    </div>
  )
}
