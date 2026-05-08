'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronDown, Calendar } from 'lucide-react'
import type { Category, MonthlyEntry } from '@/types'
import { getCurrentMonth, formatMonth, formatCurrency } from '@/lib/utils'

interface Props {
  categories: Category[]
  entries: MonthlyEntry[]
  onSave: (
    month: string,
    balances: Record<string, number>,
    incomes: Record<string, number>,
    expenses: Record<string, number>
  ) => void
}

function parseNum(v: string): number {
  const n = parseFloat(v || '0')
  return isNaN(n) ? 0 : n
}

export default function MonthlyInput({ categories, entries, onSave }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [incomes, setIncomes] = useState<Record<string, string>>({})
  const [expenses, setExpenses] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const assetCats = categories.filter((c) => c.type === 'asset')
  const incomeCats = categories.filter((c) => c.type === 'income')
  const expenseCats = categories.filter((c) => c.type === 'expense')

  useEffect(() => {
    const entry = entries.find((e) => e.month === selectedMonth)
    const init = (cats: Category[], src: Record<string, number> = {}): Record<string, string> => {
      const m: Record<string, string> = {}
      cats.forEach((c) => { m[c.id] = src[c.id] != null ? String(src[c.id]) : '' })
      return m
    }
    setBalances(init(assetCats, entry?.balances))
    setIncomes(init(incomeCats, entry?.incomes))
    setExpenses(init(expenseCats, entry?.expenses))
    setSaved(false)
  // categories split into assetCats/incomeCats/expenseCats above — depend on categories directly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, entries, categories])

  const toNumMap = (vals: Record<string, string>): Record<string, number> =>
    Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, parseNum(v)]))

  const handleSave = () => {
    onSave(selectedMonth, toNumMap(balances), toNumMap(incomes), toNumMap(expenses))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const totalAssets = assetCats.reduce((s, c) => s + parseNum(balances[c.id] || ''), 0)
  const totalIncome = incomeCats.reduce((s, c) => s + parseNum(incomes[c.id] || ''), 0)
  const totalExpense = expenseCats.reduce((s, c) => s + parseNum(expenses[c.id] || ''), 0)
  const cashFlow = totalIncome - totalExpense

  const currentYear = new Date().getFullYear()
  const monthOptions: string[] = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++)
    for (let m = 1; m <= 12; m++)
      monthOptions.push(`${y}-${String(m).padStart(2, '0')}`)
  monthOptions.reverse()

  const hasExisting = entries.some((e) => e.month === selectedMonth)

  const renderSection = (
    title: string,
    cats: Category[],
    values: Record<string, string>,
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    if (cats.length === 0) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px flex-1 bg-slate-800" />
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="space-y-3">
          {cats.map((cat) => (
            <div key={cat.id}>
              <label className="flex items-center gap-2 text-slate-300 text-sm mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                  ₪
                </span>
                <input
                  type="number"
                  min="0"
                  value={values[cat.id] ?? ''}
                  onChange={(e) => setter((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-9 focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-sm transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-white text-xl font-bold">הוספת נתונים חודשיים</h2>
        <p className="text-slate-400 text-sm mt-1">הזן יתרות נכסים, הכנסות והוצאות לחודש הנבחר</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        {/* Month selector */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 text-sm font-medium mb-2">
            <Calendar size={14} className="text-indigo-400" />
            בחר חודש
          </label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}{entries.some((e) => e.month === m) ? ' ✓' : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          {hasExisting && (
            <p className="text-amber-400/70 text-xs mt-1.5">
              * ישנם נתונים לחודש זה — שמירה תעדכן אותם
            </p>
          )}
        </div>

        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            אין קטגוריות. עבור ל&quot;הגדרות&quot; כדי להוסיף.
          </p>
        ) : (
          <>
            {renderSection('יתרות נכסים', assetCats, balances, setBalances)}
            {renderSection('הכנסות חודשיות', incomeCats, incomes, setIncomes)}
            {renderSection('הוצאות חודשיות', expenseCats, expenses, setExpenses)}

            {/* Cash flow summary */}
            {(incomeCats.length > 0 || expenseCats.length > 0) && (
              <div className="border-t border-slate-700/50 pt-3 space-y-1.5">
                {incomeCats.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">סה&quot;כ הכנסות</span>
                    <span className="text-emerald-400 text-sm font-semibold tabular-nums">
                      +{formatCurrency(totalIncome)}
                    </span>
                  </div>
                )}
                {expenseCats.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">סה&quot;כ הוצאות</span>
                    <span className="text-red-400 text-sm font-semibold tabular-nums">
                      -{formatCurrency(totalExpense)}
                    </span>
                  </div>
                )}
                {incomeCats.length > 0 && expenseCats.length > 0 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                    <span className="text-slate-300 text-sm font-medium">תזרים נקי</span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        cashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {cashFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {assetCats.length > 0 && totalAssets > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm">סה&quot;כ נכסים</span>
                <span className="text-white font-semibold tabular-nums">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
            )}

            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
              }`}
            >
              <Save size={16} />
              {saved ? 'נשמר בהצלחה!' : 'שמור נתונים'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
