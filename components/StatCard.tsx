interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  variant?: 'default' | 'highlight' | 'positive' | 'negative'
}

export default function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: StatCardProps) {
  const containerClass =
    variant === 'highlight'
      ? 'bg-indigo-950 border-indigo-800/60'
      : 'bg-slate-900 border-slate-800'

  const valueClass =
    variant === 'positive'
      ? 'text-emerald-400'
      : variant === 'negative'
      ? 'text-red-400'
      : 'text-white'

  return (
    <div className={`rounded-xl border p-5 ${containerClass}`}>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1.5">{subtitle}</p>}
    </div>
  )
}
