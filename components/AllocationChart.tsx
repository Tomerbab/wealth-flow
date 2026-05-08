'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { Category, MonthlyEntry } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  categories: Category[]
  latestEntry?: MonthlyEntry
}

const RADIAN = Math.PI / 180

interface SliceLabelProps {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  percent: number
  name: string
}

function SliceLabel({ cx, cy, midAngle, outerRadius, percent, name }: SliceLabelProps) {
  if (percent < 0.05) return null
  const r = outerRadius + 26
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="#94a3b8"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10.5}
      fontWeight={500}
    >
      {name}: {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function AllocationChart({ categories, latestEntry }: Props) {
  const data = latestEntry
    ? categories
        .filter((cat) => (latestEntry.balances[cat.id] ?? 0) > 0)
        .map((cat) => ({
          name: cat.name,
          value: latestEntry.balances[cat.id],
          color: cat.color,
        }))
    : []

  if (!latestEntry || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center h-72">
        <p className="text-slate-500 text-sm">אין נתונים להצגה</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">הרכב תיק הנכסים</h3>
      <p className="text-slate-500 text-xs mt-0.5 mb-3">לפי הנתונים האחרונים</p>
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={272}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              label={(props) => <SliceLabel {...(props as SliceLabelProps)} />}
              labelLine={{ stroke: '#334155', strokeWidth: 0.8 }}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                formatCurrency(typeof value === 'number' ? value : 0),
                '',
              ]}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#f1f5f9',
                fontSize: '13px',
                direction: 'rtl',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
