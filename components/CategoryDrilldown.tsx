'use client'

import { ArrowRight, Receipt } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Category, MonthlyEntry, CategoryFees } from '@/types'
import { formatCurrency, formatPercent, formatMonth } from '@/lib/utils'
import StatCard from '@/components/StatCard'

interface Props {
  category: Category
  entries: MonthlyEntry[] // all entries, sorted ascending
  fees: CategoryFees
  onBack: () => void
}

export default function CategoryDrilldown({ category, entries, fees, onBack }: Props) {
  // Only keep entries that have a balance recorded for this category
  const relevant = entries.filter((e) => e.balances[category.id] !== undefined)

  const latestEntry = relevant[relevant.length - 1]
  const previousEntry = relevant.length >= 2 ? relevant[relevant.length - 2] : undefined
  const firstEntry = relevant[0]

  const latestBalance = latestEntry?.balances[category.id] ?? 0
  const prevBalance = previousEntry?.balances[category.id] ?? 0
  const baselineBalance = firstEntry?.balances[category.id] ?? 0

  const isBaseline = relevant.length <= 1

  const monthlyChange = previousEntry ? latestBalance - prevBalance : null
  const monthlyChangePct =
    prevBalance > 0 && monthlyChange !== null ? (monthlyChange / prevBalance) * 100 : null

  const totalChange = !isBaseline ? latestBalance - baselineBalance : null
  const totalChangePct =
    baselineBalance > 0 && totalChange !== null ? (totalChange / baselineBalance) * 100 : null

  const chartData = relevant.map((e) => ({
    month: formatMonth(e.month, true),
    value: e.balances[category.id] ?? 0,
  }))

  const feeEntries = Object.entries(fees)
  const parsePct = (val: string) => { const n = parseFloat(val.replace('%', '')); return isNaN(n) ? 0 : n }

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors group"
        >
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          חזרה
        </button>
        <span className="text-slate-700 select-none">|</span>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <h2 className="text-white font-bold text-lg">{category.name}</h2>
        </div>
        {isBaseline && (
          <span className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
            חודש בסיס בלבד
          </span>
        )}
      </div>

      {relevant.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500 text-sm">אין נתונים לקטגוריה זו</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="יתרה נוכחית"
              value={formatCurrency(latestBalance)}
              subtitle={latestEntry ? formatMonth(latestEntry.month) : ''}
              variant="highlight"
            />
            <StatCard
              title="שינוי חודשי"
              value={monthlyChange === null ? '— (בסיס)' : formatCurrency(monthlyChange)}
              subtitle={
                previousEntry
                  ? `לעומת ${formatMonth(previousEntry.month)}`
                  : 'חודש ראשון — נקודת בסיס'
              }
              variant={
                monthlyChange === null
                  ? 'default'
                  : monthlyChange >= 0
                  ? 'positive'
                  : 'negative'
              }
            />
            <StatCard
              title="שינוי מנקודת הבסיס"
              value={
                totalChange === null || totalChangePct === null
                  ? '—'
                  : formatPercent(totalChangePct)
              }
              subtitle={
                totalChange !== null
                  ? `${formatCurrency(totalChange)} מאז ${formatMonth(firstEntry.month)}`
                  : 'אין נתונים השוואתיים'
              }
              variant={
                totalChange === null
                  ? 'default'
                  : totalChange >= 0
                  ? 'positive'
                  : 'negative'
              }
            />
          </div>

          {/* Line chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm">{`מגמת ${category.name}`}</h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-3">
              {relevant.length >= 2
                ? `${formatMonth(firstEntry.month)} — ${formatMonth(latestEntry.month)}`
                : `נקודת בסיס: ${formatMonth(firstEntry.month)}`}
            </p>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
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
                    formatter={(value) => [
                      formatCurrency(typeof value === 'number' ? value : 0),
                      category.name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      direction: 'rtl',
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={category.color}
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: category.color,
                      stroke: '#0f172a',
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5, fill: category.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {firstEntry && (
              <p className="text-slate-600 text-xs text-center mt-1">
                ● נקודת בסיס: {formatMonth(firstEntry.month)}
              </p>
            )}
          </div>

          {/* Monthly breakdown table */}
          {relevant.length >= 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">פירוט חודשי</h3>
              <div className="space-y-1.5">
                {[...relevant].reverse().map((entry, revIdx) => {
                  const fwdIdx = relevant.length - 1 - revIdx
                  const balance = entry.balances[category.id] ?? 0
                  const prevE = fwdIdx > 0 ? relevant[fwdIdx - 1] : undefined
                  const prevBal = prevE?.balances[category.id] ?? 0
                  const delta = prevE ? balance - prevBal : null
                  const pct =
                    prevBal > 0 && delta !== null ? (delta / prevBal) * 100 : null
                  const isFirst = fwdIdx === 0

                  return (
                    <div
                      key={entry.month}
                      className={`flex items-center justify-between py-2.5 px-4 rounded-lg ${
                        isFirst
                          ? 'bg-amber-950/20 border border-amber-800/30'
                          : 'bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">{formatMonth(entry.month)}</span>
                        {isFirst && (
                          <span className="text-xs text-amber-400/80 bg-amber-950/50 px-1.5 py-0.5 rounded">
                            בסיס
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {delta !== null && pct !== null && (
                          <span
                            className={`text-xs tabular-nums ${
                              delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {delta >= 0 ? '+' : ''}
                            {formatCurrency(delta)} ({formatPercent(pct)})
                          </span>
                        )}
                        <span className="text-white text-sm font-semibold tabular-nums w-28 text-left">
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Fees section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Receipt size={14} className="text-amber-400" />
          עמלות מוגדרות
        </h3>
        {feeEntries.length === 0 ? (
          <p className="text-slate-500 text-sm">
            לא הוגדרו עמלות לקטגוריה זו.{' '}
            <span className="text-slate-600">ניתן להגדיר בלשונית &quot;עמלות&quot;.</span>
          </p>
        ) : (
          <div className="space-y-2">
            {feeEntries.map(([label, value]) => {
              const monthlyCost = latestBalance * parsePct(value) / 100 / 12
              return (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 px-4 bg-amber-950/10 border border-amber-900/30 rounded-lg"
                >
                  <span className="text-slate-300 text-sm">{label}</span>
                  <div className="flex items-center gap-4">
                    {monthlyCost > 0 && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs">עלות חודשית נגזרת</p>
                        <p className="text-amber-300/70 text-xs font-medium tabular-nums">~{formatCurrency(monthlyCost)}</p>
                      </div>
                    )}
                    <span className="text-amber-400 text-sm font-semibold tabular-nums">{value}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
