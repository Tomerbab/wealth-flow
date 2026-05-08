'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Category, MonthlyEntry } from '@/types'
import { formatMonth, formatCurrency } from '@/lib/utils'

interface Props {
  categories: Category[]
  entries: MonthlyEntry[]
}

export default function WealthChart({ categories, entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center h-72">
        <p className="text-slate-500 text-sm">אין נתונים להצגה</p>
      </div>
    )
  }

  const chartData = entries.map((entry) => {
    // Sum only known categories to avoid counting orphaned JSONB keys
    const total = categories.reduce((s, cat) => s + (entry.balances[cat.id] ?? 0), 0)
    const point: Record<string, string | number> = {
      month: formatMonth(entry.month, true),
      total,
    }
    categories.forEach((cat) => {
      point[cat.id] = entry.balances[cat.id] ?? 0
    })
    return point
  })

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">מגמת הון לאורך זמן</h3>
      <p className="text-slate-500 text-xs mt-0.5 mb-3">סה"כ ופירוט לפי קטגוריה</p>
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={255}>
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
              formatter={(value, name) => {
                const numVal = typeof value === 'number' ? value : 0
                const strName = String(name ?? '')
                const cat = categories.find((c) => c.id === strName)
                const label = strName === 'total' ? 'סה"כ' : (cat?.name ?? strName)
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
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
            {categories.map((cat) => (
              <Line
                key={cat.id}
                type="monotone"
                dataKey={cat.id}
                stroke={cat.color}
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 3"
                activeDot={{ r: 3, fill: cat.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
