'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Category, MonthlyEntry } from '@/types'
import StatCard from '@/components/StatCard'
import { formatCurrency, formatMonth } from '@/lib/utils'

interface Props {
  categories: Category[]
  entries: MonthlyEntry[]
}

export default function CashFlowScreen({ categories, entries }: Props) {
  const latestMonth = entries.length > 0 ? entries[entries.length - 1].month : ''
  const [selectedMonth, setSelectedMonth] = useState<string>(latestMonth)

  // Keep selection pointing at latest when new entries are added
  useEffect(() => {
    if (entries.length > 0 && !entries.find((e) => e.month === selectedMonth)) {
      setSelectedMonth(entries[entries.length - 1].month)
    }
  }, [entries, selectedMonth])

  const incomeCats = categories.filter((c) => c.type === 'income')
  const expenseCats = categories.filter((c) => c.type === 'expense')

  const selectedEntry = entries.find((e) => e.month === selectedMonth)

  const totalIncome = selectedEntry
    ? Object.values(selectedEntry.incomes).reduce((s, v) => s + v, 0)
    : 0
  const totalExpenses = selectedEntry
    ? Object.values(selectedEntry.expenses).reduce((s, v) => s + v, 0)
    : 0
  const netProfit = totalIncome - totalExpenses
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Bar chart: all months
  const chartData = entries.map((entry) => ({
    month: formatMonth(entry.month, true),
    income: Object.values(entry.incomes).reduce((s, v) => s + v, 0),
    expenses: Object.values(entry.expenses).reduce((s, v) => s + v, 0),
  }))

  const hasChartData = chartData.some((d) => d.income > 0 || d.expenses > 0)

  // ── Empty states ────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <EmptyShell>
        <p className="text-slate-500 text-sm">אין נתונים עדיין</p>
        <p className="text-slate-600 text-xs mt-1">
          עבור ל&quot;הוספת נתונים&quot; כדי להזין נתוני חודש ראשון
        </p>
      </EmptyShell>
    )
  }

  if (incomeCats.length === 0 && expenseCats.length === 0) {
    return (
      <EmptyShell>
        <p className="text-slate-500 text-sm">לא הוגדרו קטגוריות הכנסות/הוצאות</p>
        <p className="text-slate-600 text-xs mt-1">
          הוסף קטגוריות ב&quot;הגדרות&quot; כדי לעקוב אחר תזרים מזומנים
        </p>
      </EmptyShell>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">תזרים מזומנים</h2>
          <p className="text-slate-400 text-sm mt-0.5">ניתוח הכנסות והוצאות חודשיות</p>
        </div>

        {/* Month picker */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
        >
          {[...entries].reverse().map((entry) => (
            <option key={entry.month} value={entry.month}>
              {formatMonth(entry.month)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title='סה"כ הכנסות'
          value={selectedEntry ? formatCurrency(totalIncome) : '—'}
          subtitle={selectedMonth ? formatMonth(selectedMonth) : '—'}
          variant={selectedEntry && totalIncome > 0 ? 'positive' : 'default'}
        />
        <StatCard
          title='סה"כ הוצאות'
          value={selectedEntry ? formatCurrency(totalExpenses) : '—'}
          subtitle={selectedMonth ? formatMonth(selectedMonth) : '—'}
          variant={selectedEntry && totalExpenses > 0 ? 'negative' : 'default'}
        />
        <StatCard
          title="רווח נקי"
          value={selectedEntry ? formatCurrency(netProfit) : '—'}
          subtitle={selectedMonth ? formatMonth(selectedMonth) : '—'}
          variant={
            !selectedEntry
              ? 'default'
              : netProfit >= 0
              ? 'positive'
              : 'negative'
          }
        />
        <StatCard
          title="אחוז חיסכון"
          value={
            selectedEntry && totalIncome > 0
              ? `${savingsRate.toFixed(1)}%`
              : '—'
          }
          subtitle="(הכנסות − הוצאות) ÷ הכנסות"
          variant={
            !selectedEntry || totalIncome === 0
              ? 'default'
              : savingsRate >= 0
              ? 'positive'
              : 'negative'
          }
        />
      </div>

      {/* ── Bar chart ──────────────────────────────────────────────── */}
      {hasChartData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm">הכנסות מול הוצאות</h3>
          <p className="text-slate-500 text-xs mt-0.5 mb-4">השוואה חודשית לאורך זמן</p>
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                barCategoryGap="30%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
                  width={52}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const numVal = typeof value === 'number' ? value : 0
                    const label = String(name) === 'income' ? 'הכנסות' : 'הוצאות'
                    return [formatCurrency(numVal), label]
                  }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    direction: 'rtl',
                  }}
                  cursor={{ fill: '#1e293b', opacity: 0.6 }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {value === 'income' ? 'הכנסות' : 'הוצאות'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="expenses"
                  name="expenses"
                  fill="#ef4444"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Detail table ───────────────────────────────────────────── */}
      {selectedEntry && (incomeCats.length > 0 || expenseCats.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">
            פירוט — {selectedMonth ? formatMonth(selectedMonth) : ''}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Incomes column */}
            {incomeCats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    הכנסות
                  </span>
                </div>
                <div className="space-y-1.5">
                  {incomeCats
                    .map((cat) => ({ cat, amount: selectedEntry.incomes[cat.id] ?? 0 }))
                    .sort((a, b) => b.amount - a.amount)
                    .map(({ cat, amount }) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between py-2.5 px-3 bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-slate-300 text-sm truncate">{cat.name}</span>
                        </div>
                        <div className="text-left flex-shrink-0 ms-3">
                          <span className="text-white text-sm font-semibold tabular-nums block">
                            {formatCurrency(amount)}
                          </span>
                          {totalIncome > 0 && amount > 0 && (
                            <span className="text-slate-500 text-xs">
                              {((amount / totalIncome) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                  <div className="flex items-center justify-between py-2 px-3 border-t border-slate-700/50 mt-1">
                    <span className="text-slate-400 text-sm font-medium">סה&quot;כ</span>
                    <span className="text-emerald-400 text-sm font-bold tabular-nums">
                      +{formatCurrency(totalIncome)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses column */}
            {expenseCats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                    הוצאות
                  </span>
                </div>
                <div className="space-y-1.5">
                  {expenseCats
                    .map((cat) => ({ cat, amount: selectedEntry.expenses[cat.id] ?? 0 }))
                    .sort((a, b) => b.amount - a.amount)
                    .map(({ cat, amount }) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between py-2.5 px-3 bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-slate-300 text-sm truncate">{cat.name}</span>
                        </div>
                        <div className="text-left flex-shrink-0 ms-3">
                          <span className="text-white text-sm font-semibold tabular-nums block">
                            {formatCurrency(amount)}
                          </span>
                          {totalExpenses > 0 && amount > 0 && (
                            <span className="text-slate-500 text-xs">
                              {((amount / totalExpenses) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                  <div className="flex items-center justify-between py-2 px-3 border-t border-slate-700/50 mt-1">
                    <span className="text-slate-400 text-sm font-medium">סה&quot;כ</span>
                    <span className="text-red-400 text-sm font-bold tabular-nums">
                      -{formatCurrency(totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Net row */}
          {incomeCats.length > 0 && expenseCats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-200 text-sm font-semibold">תזרים נקי לחודש</span>
              <span
                className={`text-base font-bold tabular-nums ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {netProfit >= 0 ? '+' : ''}
                {formatCurrency(netProfit)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">תזרים מזומנים</h2>
        <p className="text-slate-400 text-sm mt-0.5">ניתוח הכנסות והוצאות חודשיות</p>
      </div>
      <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
        {children}
      </div>
    </div>
  )
}
