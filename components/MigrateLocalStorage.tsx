'use client'

import { useState } from 'react'
import { DatabaseZap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { FinanceData, Category, CategoryType, MonthlyEntry } from '@/types'

const STORAGE_KEY = 'wealthflow_data'

type Status = 'idle' | 'running' | 'done' | 'error'

function readLocalStorage(): FinanceData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Same schema migration logic as the old hook
    const rawCats = (parsed.categories ?? []) as Array<Record<string, unknown>>
    const categories: Category[] = rawCats.map((c) => ({
      id:    String(c.id    ?? ''),
      name:  String(c.name  ?? ''),
      color: String(c.color ?? '#6366f1'),
      type:  (c.type ?? 'asset') as CategoryType,
    })).filter((c) => c.id !== '')

    const rawEntries = (parsed.entries ?? []) as Array<Record<string, unknown>>
    const entries: MonthlyEntry[] = rawEntries.map((e) => ({
      month:    String(e.month ?? ''),
      balances: (e.balances  ?? {}) as Record<string, number>,
      incomes:  (e.incomes   ?? {}) as Record<string, number>,
      expenses: (e.expenses  ?? {}) as Record<string, number>,
    })).filter((e) => e.month !== '')

    const fees = (parsed.fees ?? {}) as Record<string, Record<string, string>>

    return { categories, entries, fees }
  } catch {
    return null
  }
}

export default function MigrateLocalStorage({ onMigrated, userId }: { onMigrated: () => void; userId: string }) {
  const [status, setStatus]   = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats]     = useState({ cats: 0, entries: 0 })

  const hasLocalData = typeof window !== 'undefined' &&
    !!localStorage.getItem(STORAGE_KEY)

  if (!hasLocalData) return null

  const migrate = async () => {
    setStatus('running')
    setMessage('קורא נתונים מהדפדפן...')

    const local = readLocalStorage()
    if (!local || (local.categories.length === 0 && local.entries.length === 0)) {
      setStatus('error')
      setMessage('לא נמצאו נתונים לייצוא')
      return
    }

    try {
      // ── 1. Upsert categories (embed fees inline) ──────────────────
      setMessage(`מעלה ${local.categories.length} קטגוריות...`)
      const catRows = local.categories.map((cat, i) => ({
        id:         cat.id,
        user_id:    userId,
        name:       cat.name,
        color:      cat.color,
        type:       cat.type,
        fees:       local.fees[cat.id] ?? {},
        created_at: new Date(Date.now() + i).toISOString(), // preserve order
      }))

      const { error: catErr } = await supabase
        .from('categories')
        .upsert(catRows, { onConflict: 'id' })
      if (catErr) throw new Error(`קטגוריות: ${catErr.message}`)

      // ── 2. Upsert monthly entries ─────────────────────────────────
      setMessage(`מעלה ${local.entries.length} רשומות חודשיות...`)
      const entryRows = local.entries.map((e) => ({
        user_id:  userId,
        month:    e.month,
        balances: e.balances,
        incomes:  e.incomes,
        expenses: e.expenses,
      }))

      const { error: entryErr } = await supabase
        .from('monthly_entries')
        .upsert(entryRows, { onConflict: 'user_id,month' })
      if (entryErr) throw new Error(`רשומות חודשיות: ${entryErr.message}`)

      setStats({ cats: local.categories.length, entries: local.entries.length })
      setStatus('done')
      setMessage('')

      // Notify parent to reload data from Supabase
      setTimeout(onMigrated, 1500)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    }
  }

  return (
    <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
      <DatabaseZap size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-amber-300 text-sm font-medium">נמצאו נתונים שמורים בדפדפן</p>
        <p className="text-amber-500/80 text-xs mt-0.5">
          לחץ &quot;ייבא&quot; כדי להעביר את ההיסטוריה שלך ל-Supabase
        </p>

        {status === 'running' && (
          <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            {message}
          </p>
        )}

        {status === 'done' && (
          <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={12} />
            הועברו {stats.cats} קטגוריות ו-{stats.entries} חודשים בהצלחה!
          </p>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            {message}
          </p>
        )}
      </div>

      {status === 'idle' && (
        <button
          onClick={migrate}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          ייבא
        </button>
      )}
    </div>
  )
}
