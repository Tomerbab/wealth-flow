'use client'

import { useState } from 'react'
import { LayoutGrid, CirclePlus, TrendingUp, Settings, BarChart2, LogOut, Eye, EyeOff } from 'lucide-react'
import { useFinanceData } from '@/hooks/useFinanceData'
import { supabase } from '@/lib/supabaseClient'
import StatCard from '@/components/StatCard'
import WealthChart from '@/components/WealthChart'
import AllocationChart from '@/components/AllocationChart'
import MonthlyInput from '@/components/MonthlyInput'
import CategoryDrilldown from '@/components/CategoryDrilldown'
import SystemSettings from '@/components/SystemSettings'
import CashFlowScreen from '@/components/CashFlowScreen'
import MigrateLocalStorage from '@/components/MigrateLocalStorage'
import { formatCurrency, formatPercent, formatMonth } from '@/lib/utils'

interface Props {
  userId: string
  userEmail: string
}

type Tab = 'dashboard' | 'cashflow' | 'input' | 'settings'

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'לוח בקרה',      Icon: LayoutGrid },
  { id: 'cashflow',  label: 'תזרים מזומנים', Icon: BarChart2  },
  { id: 'input',     label: 'הוספת נתונים',  Icon: CirclePlus },
  { id: 'settings',  label: 'הגדרות',         Icon: Settings   },
]

export default function Dashboard({ userId, userEmail }: Props) {
  const [activeTab, setActiveTab]           = useState<Tab>('dashboard')
  const [drilldownCatId, setDrilldownCatId] = useState<string | null>(null)
  const [hiddenAssets, setHiddenAssets]     = useState<Set<string>>(new Set())
  const finance = useFinanceData(userId)

  const toggleAsset = (id: string) =>
    setHiddenAssets((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleLogout  = () => supabase.auth.signOut()
  const handleMigrated = () => finance.refresh()

  if (!finance.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
            <TrendingUp size={20} className="text-white" />
          </div>
          <p className="text-slate-500 text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  const assetCats        = finance.data.categories.filter((c) => c.type === 'asset')
  const incomeCats       = finance.data.categories.filter((c) => c.type === 'income')
  const expenseCats      = finance.data.categories.filter((c) => c.type === 'expense')
  const visibleAssetCats = assetCats.filter((c) => !hiddenAssets.has(c.id))

  const latestEntry   = finance.getLatestEntry()
  const previousEntry = finance.getPreviousEntry()

  const allAssetsTotal = latestEntry   ? assetCats.reduce((s, c) => s + (latestEntry.balances[c.id]   ?? 0), 0) : 0
  const latestTotal    = latestEntry   ? visibleAssetCats.reduce((s, c) => s + (latestEntry.balances[c.id]   ?? 0), 0) : 0
  const previousTotal  = previousEntry ? visibleAssetCats.reduce((s, c) => s + (previousEntry.balances[c.id] ?? 0), 0) : 0
  const monthlyChange    = latestTotal - previousTotal
  const monthlyChangePct = previousTotal > 0 ? (monthlyChange / previousTotal) * 100 : 0

  const totalMonthlyIncome  = latestEntry ? Object.values(latestEntry.incomes).reduce((s, v)  => s + v, 0) : 0
  const totalMonthlyExpense = latestEntry ? Object.values(latestEntry.expenses).reduce((s, v) => s + v, 0) : 0
  const cashFlow = totalMonthlyIncome - totalMonthlyExpense

  const isBaselineOnly = finance.data.entries.length === 1

  const parsePct = (val: string) => { const n = parseFloat(val.replace('%', '')); return isNaN(n) ? 0 : n }
  const annualFeeRunRate = latestEntry
    ? assetCats.reduce((sum, cat) => {
        const balance = latestEntry.balances[cat.id] ?? 0
        const catFees = finance.data.fees[cat.id] ?? {}
        return sum + Object.values(catFees).reduce((s, v) => s + balance * parsePct(v) / 100, 0)
      }, 0)
    : 0
  const hasFees = Object.values(finance.data.fees).some((f) => Object.keys(f).length > 0)

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3.5">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">WealthFlow</span>
            </div>

            {/* Right side: last-update + user info + logout */}
            <div className="flex items-center gap-2">
              {latestEntry && (
                <span className="text-slate-400 text-xs bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 hidden sm:inline-flex">
                  עדכון אחרון: {formatMonth(latestEntry.month)}
                </span>
              )}
              <span
                className="text-slate-500 text-xs hidden md:block max-w-[160px] truncate"
                title={userEmail}
              >
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                title="יציאה מהחשבון"
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Tabs — hidden during drill-down */}
          {!drilldownCatId && (
            <nav className="flex gap-0 -mb-px">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-16">

        {/* ── DRILL-DOWN ── */}
        {drilldownCatId && (() => {
          const cat = finance.data.categories.find((c) => c.id === drilldownCatId)
          if (!cat) return null
          return (
            <CategoryDrilldown
              category={cat}
              entries={finance.data.entries}
              fees={finance.data.fees[drilldownCatId] ?? {}}
              onBack={() => setDrilldownCatId(null)}
            />
          )
        })()}

        {/* ── DASHBOARD TAB ── */}
        {!drilldownCatId && activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title='סה"כ הון עצמי'
                value={formatCurrency(latestTotal)}
                subtitle={
                  latestEntry
                    ? isBaselineOnly
                      ? `${formatMonth(latestEntry.month)} — נקודת בסיס`
                      : formatMonth(latestEntry.month)
                    : '—'
                }
                variant="highlight"
              />
              <StatCard
                title="שינוי חודשי"
                value={isBaselineOnly || !previousEntry ? '— (בסיס)' : formatCurrency(monthlyChange)}
                subtitle={previousEntry ? `לעומת ${formatMonth(previousEntry.month)}` : 'חודש ראשון — נקודת בסיס'}
                variant={isBaselineOnly || !previousEntry ? 'default' : monthlyChange >= 0 ? 'positive' : 'negative'}
              />
              <StatCard
                title="שינוי באחוזים"
                value={isBaselineOnly || !previousEntry ? '—' : formatPercent(monthlyChangePct)}
                subtitle={isBaselineOnly ? 'נקודת בסיס' : 'מהחודש הקודם'}
                variant={isBaselineOnly || !previousEntry ? 'default' : monthlyChangePct >= 0 ? 'positive' : 'negative'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AllocationChart categories={visibleAssetCats} latestEntry={latestEntry} />
              <WealthChart     categories={visibleAssetCats} entries={finance.data.entries} />
            </div>

            {latestEntry && finance.data.categories.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">פירוט {formatMonth(latestEntry.month)}</h3>
                  {assetCats.length > 0 && <span className="text-slate-600 text-xs">לחץ על נכס לפירוט מלא</span>}
                </div>

                {assetCats.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                    {assetCats.map((cat) => {
                      const balance    = latestEntry.balances[cat.id] ?? 0
                      const pct        = allAssetsTotal > 0 ? ((balance / allAssetsTotal) * 100).toFixed(1) : '0'
                      const isHidden   = hiddenAssets.has(cat.id)

                      const prevBalance  = previousEntry?.balances[cat.id]
                      const hasTrend     = prevBalance !== undefined && prevBalance > 0
                      const trendDelta   = hasTrend ? balance - (prevBalance as number) : null
                      const trendPct     = hasTrend && trendDelta !== null ? (trendDelta / (prevBalance as number)) * 100 : null

                      return (
                        <button
                          key={cat.id}
                          onClick={() => setDrilldownCatId(cat.id)}
                          className={`flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/40 hover:border-slate-600 hover:bg-slate-800 transition-all text-right group ${isHidden ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <div className="min-w-0">
                              <p className="text-slate-300 text-sm truncate group-hover:text-white transition-colors">{cat.name}</p>
                              <p className="text-slate-600 text-xs">{pct}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ms-2 flex-shrink-0">
                            {trendDelta !== null && trendPct !== null && (
                              <span className={`text-xs tabular-nums ${trendDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trendDelta >= 0 ? '↑' : '↓'}{Math.abs(trendPct).toFixed(1)}%
                              </span>
                            )}
                            <span className="text-white text-sm font-semibold tabular-nums">
                              {formatCurrency(balance)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleAsset(cat.id) }}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                              title={isHidden ? 'הצג נכס' : 'הסתר נכס'}
                            >
                              {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {(incomeCats.length > 0 || expenseCats.length > 0) && (
                  <div className={`flex items-center gap-6 flex-wrap ${assetCats.length > 0 ? 'border-t border-slate-800 pt-3' : ''}`}>
                    {incomeCats.length > 0 && (
                      <div>
                        <p className="text-slate-600 text-xs mb-0.5">הכנסות חודשיות</p>
                        <p className="text-emerald-400 text-sm font-semibold tabular-nums">+{formatCurrency(totalMonthlyIncome)}</p>
                      </div>
                    )}
                    {expenseCats.length > 0 && (
                      <div>
                        <p className="text-slate-600 text-xs mb-0.5">הוצאות חודשיות</p>
                        <p className="text-red-400 text-sm font-semibold tabular-nums">-{formatCurrency(totalMonthlyExpense)}</p>
                      </div>
                    )}
                    {incomeCats.length > 0 && expenseCats.length > 0 && (
                      <div className="mr-auto">
                        <p className="text-slate-600 text-xs mb-0.5">תזרים נקי</p>
                        <p className={`text-sm font-semibold tabular-nums ${cashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {cashFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasFees && latestEntry && annualFeeRunRate > 0 && (
              <div className="border border-slate-800/60 rounded-xl px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 text-xs">סה&quot;כ קצב עמלות שנתי משוער</span>
                  <span className="text-slate-700 text-xs hidden sm:inline">·</span>
                  <span className="text-slate-600 text-xs hidden sm:inline">על בסיס יתרות אחרונות</span>
                </div>
                <span className="text-amber-400 text-sm font-semibold tabular-nums flex-shrink-0">~{formatCurrency(annualFeeRunRate)}</span>
              </div>
            )}

            {finance.data.entries.length === 0 && (
              <div className="text-center py-16">
                <TrendingUp size={40} className="mx-auto mb-3 text-slate-800" />
                <p className="text-slate-500 text-base font-medium">ברוך הבא ל-WealthFlow</p>
                <p className="text-slate-600 text-sm mt-1">עבור ל&quot;הוספת נתונים&quot; כדי להתחיל לעקוב אחר ההון שלך</p>
              </div>
            )}
          </div>
        )}

        {/* ── CASH FLOW TAB ── */}
        {!drilldownCatId && activeTab === 'cashflow' && (
          <CashFlowScreen categories={finance.data.categories} entries={finance.data.entries} />
        )}

        {/* ── INPUT TAB ── */}
        {!drilldownCatId && activeTab === 'input' && (
          <MonthlyInput
            categories={finance.data.categories}
            entries={finance.data.entries}
            onSave={finance.saveMonthlyEntry}
          />
        )}

        {/* ── SETTINGS TAB ── */}
        {!drilldownCatId && activeTab === 'settings' && (
          <div className="space-y-5">
            {/* User info card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">מחובר בתור</p>
                <p className="text-white text-sm font-medium">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={14} />
                יציאה
              </button>
            </div>

            <MigrateLocalStorage userId={userId} onMigrated={handleMigrated} />

            <SystemSettings
              categories={finance.data.categories}
              fees={finance.data.fees}
              onAddCategory={finance.addCategory}
              onUpdateCategory={finance.updateCategory}
              onDeleteCategory={finance.deleteCategory}
              onSaveFees={finance.saveCategoryFees}
            />
          </div>
        )}
      </main>
    </div>
  )
}
