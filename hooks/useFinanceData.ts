'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FinanceData, Category, CategoryType, MonthlyEntry, CategoryFees } from '@/types'
import { CATEGORY_COLORS } from '@/lib/mockData'
import { generateId, totalForBalances } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

// ── DB row shapes ─────────────────────────────────────────────────────
interface DbCategory {
  id: string
  user_id: string
  name: string
  color: string
  type: string
  fees: Record<string, string>
  created_at: string
}

interface DbEntry {
  id: string
  user_id: string
  month: string
  balances: Record<string, number>
  incomes: Record<string, number>
  expenses: Record<string, number>
  created_at: string
}

// ── Loader ────────────────────────────────────────────────────────────
async function fetchData(userId: string): Promise<FinanceData | null> {
  const [{ data: cats, error: catsErr }, { data: entries, error: entriesErr }] =
    await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('monthly_entries').select('*').eq('user_id', userId).order('month'),
    ])

  if (catsErr)    { console.error('categories fetch error:', catsErr);    return null }
  if (entriesErr) { console.error('monthly_entries fetch error:', entriesErr); return null }

  const categories: Category[] = (cats as DbCategory[]).map((c) => ({
    id: c.id, name: c.name, color: c.color, type: c.type as CategoryType,
  }))

  const fees: Record<string, CategoryFees> = {}
  ;(cats as DbCategory[]).forEach((c) => {
    if (c.fees && Object.keys(c.fees).length > 0) fees[c.id] = c.fees
  })

  const monthlyEntries: MonthlyEntry[] = (entries as DbEntry[]).map((e) => ({
    month: e.month,
    balances: e.balances  ?? {},
    incomes:  e.incomes   ?? {},
    expenses: e.expenses  ?? {},
  }))

  return { categories, entries: monthlyEntries, fees }
}

// ── Hook ──────────────────────────────────────────────────────────────
const EMPTY: FinanceData = { categories: [], entries: [], fees: {} }

export function useFinanceData(userId: string) {
  const [data, setData]         = useState<FinanceData>(EMPTY)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!userId) return
    setIsLoaded(false)
    fetchData(userId).then((d) => {
      if (d) setData(d)
      setIsLoaded(true)
    })
  }, [userId])

  const refresh = useCallback(async () => {
    setIsLoaded(false)
    const d = await fetchData(userId)
    if (d) setData(d)
    setIsLoaded(true)
  }, [userId])

  // ── Category mutations ──────────────────────────────────────────────

  const addCategory = useCallback(async (name: string, type: CategoryType = 'asset') => {
    setData((prev) => {
      const usedColors = prev.categories.map((c) => c.color)
      const color =
        CATEGORY_COLORS.find((c) => !usedColors.includes(c)) ||
        CATEGORY_COLORS[prev.categories.length % CATEGORY_COLORS.length]
      const newCat: Category = { id: generateId(), name, color, type }

      supabase.from('categories')
        .insert({ id: newCat.id, user_id: userId, name, color: newCat.color, type, fees: {} })
        .then(({ error }) => { if (error) console.error('addCategory:', error) })

      return { ...prev, categories: [...prev.categories, newCat] }
    })
  }, [userId])

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Omit<Category, 'id' | 'type'>>) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
      const { error } = await supabase
        .from('categories').update(updates).eq('id', id).eq('user_id', userId)
      if (error) console.error('updateCategory:', error)
    },
    [userId]
  )

  const deleteCategory = useCallback(async (id: string) => {
    setData((prev) => {
      const cat  = prev.categories.find((c) => c.id === id)
      const type = cat?.type ?? 'asset'

      const entries = prev.entries.map((entry) => {
        if (type === 'income') {
          const { [id]: _, ...incomes } = entry.incomes
          return { ...entry, incomes }
        }
        if (type === 'expense') {
          const { [id]: _, ...expenses } = entry.expenses
          return { ...entry, expenses }
        }
        const { [id]: _, ...balances } = entry.balances
        return { ...entry, balances }
      })

      const fees = Object.fromEntries(Object.entries(prev.fees).filter(([k]) => k !== id))

      // Persist deletion
      supabase.from('categories').delete().eq('id', id).eq('user_id', userId)
        .then(({ error }) => { if (error) console.error('deleteCategory:', error) })

      // Best-effort: scrub stale key from all entry JSONB columns
      const field = type === 'income' ? 'incomes' : type === 'expense' ? 'expenses' : 'balances'
      supabase.from('monthly_entries').select('id, balances, incomes, expenses').eq('user_id', userId)
        .then(({ data: rows }) => {
          if (!rows) return
          const updates = (rows as DbEntry[]).map((row) => {
            const src = field === 'incomes' ? row.incomes : field === 'expenses' ? row.expenses : row.balances
            const col = { ...src }
            delete col[id]
            return { id: row.id, [field]: col }
          })
          supabase.from('monthly_entries').upsert(updates)
            .then(({ error }) => { if (error) console.error('deleteCategory entry patch:', error) })
        })

      return { ...prev, categories: prev.categories.filter((c) => c.id !== id), entries, fees }
    })
  }, [userId])

  // ── Entry mutations ─────────────────────────────────────────────────

  const saveMonthlyEntry = useCallback(
    async (
      month:    string,
      balances: Record<string, number>,
      incomes:  Record<string, number>,
      expenses: Record<string, number>
    ) => {
      const newEntry: MonthlyEntry = { month, balances, incomes, expenses }

      setData((prev) => {
        const idx = prev.entries.findIndex((e) => e.month === month)
        if (idx >= 0) {
          const entries = [...prev.entries]
          entries[idx] = newEntry
          return { ...prev, entries }
        }
        const entries = [...prev.entries, newEntry].sort((a, b) => a.month.localeCompare(b.month))
        return { ...prev, entries }
      })

      const { error } = await supabase.from('monthly_entries').upsert(
        { user_id: userId, month, balances, incomes, expenses },
        { onConflict: 'user_id,month' }
      )
      if (error) console.error('saveMonthlyEntry:', error)
    },
    [userId]
  )

  // ── Fees ────────────────────────────────────────────────────────────

  const saveCategoryFees = useCallback(
    async (categoryId: string, fees: CategoryFees) => {
      setData((prev) => ({ ...prev, fees: { ...prev.fees, [categoryId]: fees } }))
      const { error } = await supabase
        .from('categories').update({ fees }).eq('id', categoryId).eq('user_id', userId)
      if (error) console.error('saveCategoryFees:', error)
    },
    [userId]
  )

  // ── Derived helpers ─────────────────────────────────────────────────

  const getEntryForMonth = useCallback(
    (month: string) => data.entries.find((e) => e.month === month),
    [data.entries]
  )
  const getLatestEntry   = useCallback(() => data.entries[data.entries.length - 1], [data.entries])
  const getPreviousEntry = useCallback(() => data.entries[data.entries.length - 2], [data.entries])

  return {
    data, isLoaded, refresh,
    addCategory, updateCategory, deleteCategory,
    saveMonthlyEntry, saveCategoryFees,
    getEntryForMonth, getLatestEntry, getPreviousEntry,
    totalForBalances,
  }
}
