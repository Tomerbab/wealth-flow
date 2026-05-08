'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ReceiptText } from 'lucide-react'
import type { Category, CategoryType, CategoryFees } from '@/types'
import { CATEGORY_COLORS } from '@/lib/mockData'

interface Props {
  categories: Category[]
  fees: Record<string, CategoryFees>
  onAddCategory: (name: string, type: CategoryType) => void
  onUpdateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'type'>>) => void
  onDeleteCategory: (id: string) => void
  onSaveFees: (categoryId: string, fees: CategoryFees) => void
}

interface FeeRow { label: string; value: string }

type SubTab = 'assets' | 'incomes' | 'expenses'

const SUB_TABS: { id: SubTab; label: string; type: CategoryType }[] = [
  { id: 'assets',   label: 'נכסים',  type: 'asset'   },
  { id: 'incomes',  label: 'הכנסות', type: 'income'  },
  { id: 'expenses', label: 'הוצאות', type: 'expense' },
]

const ADD_PLACEHOLDER: Record<SubTab, string> = {
  assets:   'שם נכס (למשל: נדל"ן, קריפטו...)',
  incomes:  'שם הכנסה (למשל: בונוס, שכירות...)',
  expenses: 'שם הוצאה (למשל: ביטוח, חינוך...)',
}

export default function SystemSettings({
  categories, fees, onAddCategory, onUpdateCategory, onDeleteCategory, onSaveFees,
}: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>('assets')
  const [newName, setNewName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingFeesId, setEditingFeesId] = useState<string | null>(null)
  const [editFeeRows, setEditFeeRows] = useState<FeeRow[]>([])
  const [savedFees, setSavedFees] = useState(false)

  const activeType = SUB_TABS.find((t) => t.id === activeTab)!.type
  const filtered = categories.filter((c) => c.type === activeType)

  const switchTab = (tab: SubTab) => {
    setActiveTab(tab)
    setNewName('')
    setEditingCatId(null)
    setEditingFeesId(null)
    setDeleteConfirm(null)
  }

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAddCategory(trimmed, activeType)
    setNewName('')
  }

  const startEditCat = (cat: Category) => {
    setEditingCatId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setDeleteConfirm(null)
    setEditingFeesId(null)
  }

  const saveEditCat = () => {
    if (!editingCatId || !editName.trim()) return
    onUpdateCategory(editingCatId, { name: editName.trim(), color: editColor })
    setEditingCatId(null)
  }

  const cancelEditCat = () => {
    setEditingCatId(null)
  }

  const startEditFees = (catId: string) => {
    const existing = fees[catId] ?? {}
    setEditFeeRows(Object.entries(existing).map(([label, value]) => ({ label, value })))
    setEditingFeesId(catId)
    setEditingCatId(null)
    setSavedFees(false)
  }

  const saveEditFees = (catId: string) => {
    const cleaned = editFeeRows.filter((r) => r.label.trim() !== '')
    onSaveFees(catId, Object.fromEntries(cleaned.map((r) => [r.label.trim(), r.value.trim()])))
    setEditingFeesId(null)
    setEditFeeRows([])
    setSavedFees(true)
    setTimeout(() => setSavedFees(false), 2000)
  }

  const cancelEditFees = () => {
    setEditingFeesId(null)
    setEditFeeRows([])
  }

  const updateFeeRow = (idx: number, field: keyof FeeRow, val: string) =>
    setEditFeeRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))

  const removeFeeRow = (idx: number) =>
    setEditFeeRows((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-white text-xl font-bold">הגדרות מערכת</h2>
        <p className="text-slate-400 text-sm mt-1">נהל קטגוריות נכסים, הכנסות והוצאות</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800 mb-5">
        {SUB_TABS.map(({ id, label, type }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
            <span className="mr-1.5 text-xs text-slate-600">
              ({categories.filter((c) => c.type === type).length})
            </span>
          </button>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={ADD_PLACEHOLDER[activeTab]}
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-sm transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          הוסף
        </button>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500 text-sm">אין קטגוריות מסוג זה עדיין</p>
            <p className="text-slate-600 text-xs mt-1">הוסף קטגוריה ראשונה למעלה</p>
          </div>
        ) : (
          filtered.map((cat) => {
            const catFees = fees[cat.id] ?? {}
            const feeEntries = Object.entries(catFees)
            const isEditingCat = editingCatId === cat.id
            const isEditingFees = editingFeesId === cat.id

            return (
              <div
                key={cat.id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-colors ${
                  isEditingCat || isEditingFees
                    ? 'border-indigo-700/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Category row */}
                <div className="px-4 py-3.5">
                  {isEditingCat ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditCat()
                          if (e.key === 'Escape') cancelEditCat()
                        }}
                        autoFocus
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                              editColor === color
                                ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                                : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditCat}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <X size={13} /> ביטול
                        </button>
                        <button
                          onClick={saveEditCat}
                          disabled={!editName.trim()}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-900/30 disabled:opacity-40 transition-colors"
                        >
                          <Check size={13} /> שמור
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-white text-sm font-medium">{cat.name}</span>
                        {activeTab === 'assets' && feeEntries.length > 0 && !isEditingFees && (
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {feeEntries.length} עמלות
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {deleteConfirm === cat.id ? (
                          <>
                            <span className="text-red-400 text-xs ml-2">מחק בטוח?</span>
                            <button
                              onClick={() => { onDeleteCategory(cat.id); setDeleteConfirm(null) }}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-950/50 hover:bg-red-900/50 transition-colors"
                            >
                              כן
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-slate-400 hover:text-slate-300 p-0.5"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditCat(cat)}
                              className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm(cat.id)
                                setEditingCatId(null)
                                setEditingFeesId(null)
                              }}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fees section — assets only */}
                {activeTab === 'assets' && !isEditingCat && (
                  <div className="border-t border-slate-800 bg-slate-900/50 px-4 py-3">
                    {isEditingFees ? (
                      <div className="space-y-2">
                        {editFeeRows.length === 0 && (
                          <p className="text-slate-600 text-xs text-center py-1">
                            לחץ &quot;הוסף שורה&quot; כדי להוסיף עמלה
                          </p>
                        )}
                        {editFeeRows.map((row, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => updateFeeRow(idx, 'label', e.target.value)}
                              placeholder="שם העמלה"
                              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                            />
                            <input
                              type="text"
                              value={row.value}
                              onChange={(e) => updateFeeRow(idx, 'value', e.target.value)}
                              placeholder="1.5%, ₪15..."
                              dir="ltr"
                              className="w-28 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors text-left"
                            />
                            <button
                              onClick={() => removeFeeRow(idx)}
                              className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setEditFeeRows((prev) => [...prev, { label: '', value: '' }])}
                            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
                          >
                            <Plus size={12} /> הוסף שורה
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEditFees}
                              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <X size={12} /> ביטול
                            </button>
                            <button
                              onClick={() => saveEditFees(cat.id)}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs px-2.5 py-1 rounded-lg hover:bg-emerald-900/30 transition-colors"
                            >
                              <Check size={12} /> שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {feeEntries.length === 0 ? (
                            <span className="text-slate-600 text-xs">אין עמלות</span>
                          ) : (
                            <div className="space-y-1">
                              {feeEntries.map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between">
                                  <span className="text-slate-400 text-xs">{label}</span>
                                  <span className="text-amber-400 text-xs font-medium tabular-nums">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startEditFees(cat.id)}
                          className="flex items-center gap-1 text-slate-500 hover:text-indigo-400 text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
                        >
                          <ReceiptText size={12} />
                          {feeEntries.length === 0 ? 'הגדר עמלות' : 'ערוך'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {savedFees && (
        <p className="text-emerald-400 text-sm text-center mt-4">✓ עמלות נשמרו</p>
      )}
    </div>
  )
}
