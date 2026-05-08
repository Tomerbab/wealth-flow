'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X, ReceiptText } from 'lucide-react'
import type { Category, CategoryFees } from '@/types'

interface Props {
  categories: Category[]
  fees: Record<string, CategoryFees>
  onSaveFees: (categoryId: string, fees: CategoryFees) => void
}

interface FeeRow {
  label: string
  value: string
}

export default function FeesManager({ categories, fees, onSaveFees }: Props) {
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editRows, setEditRows] = useState<FeeRow[]>([])
  const [saved, setSaved] = useState(false)

  const startEdit = (catId: string) => {
    const existing = fees[catId] ?? {}
    setEditRows(Object.entries(existing).map(([label, value]) => ({ label, value })))
    setEditingCatId(catId)
    setSaved(false)
  }

  const cancelEdit = () => {
    setEditingCatId(null)
    setEditRows([])
  }

  const saveEdit = (catId: string) => {
    const cleaned = editRows.filter((r) => r.label.trim() !== '')
    const record = Object.fromEntries(cleaned.map((r) => [r.label.trim(), r.value.trim()]))
    onSaveFees(catId, record)
    setEditingCatId(null)
    setEditRows([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addRow = () => setEditRows((prev) => [...prev, { label: '', value: '' }])

  const updateRow = (idx: number, field: keyof FeeRow, val: string) => {
    setEditRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  }

  const removeRow = (idx: number) => {
    setEditRows((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-white text-xl font-bold">ניהול עמלות</h2>
        <p className="text-slate-400 text-sm mt-1">
          הגדר עמלות ודמי ניהול עבור כל קטגוריית נכס
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-dashed border-slate-700 rounded-xl">
          <ReceiptText size={32} className="text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">אין קטגוריות מוגדרות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catFees = fees[cat.id] ?? {}
            const feeEntries = Object.entries(catFees)
            const isEditing = editingCatId === cat.id

            return (
              <div
                key={cat.id}
                className={`bg-slate-900 border rounded-xl p-5 transition-colors ${
                  isEditing ? 'border-indigo-700/60' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-white font-semibold text-sm">{cat.name}</span>
                    {!isEditing && feeEntries.length > 0 && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {feeEntries.length} עמלות
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(cat.id)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Pencil size={13} />
                      ערוך
                    </button>
                  )}
                </div>

                {/* View mode */}
                {!isEditing && (
                  <div>
                    {feeEntries.length === 0 ? (
                      <button
                        onClick={() => startEdit(cat.id)}
                        className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-600 text-sm hover:border-slate-600 hover:text-slate-500 transition-colors"
                      >
                        + הוסף עמלה ראשונה
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {feeEntries.map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg"
                          >
                            <span className="text-slate-300 text-sm">{label}</span>
                            <span className="text-amber-400 text-sm font-medium tabular-nums">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div className="space-y-3">
                    {editRows.length === 0 && (
                      <p className="text-slate-600 text-sm text-center py-2">
                        לחץ &quot;הוסף שורה&quot; כדי להוסיף עמלה
                      </p>
                    )}

                    {editRows.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateRow(idx, 'label', e.target.value)}
                          placeholder="שם העמלה (למשל: דמי ניהול)"
                          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => updateRow(idx, 'value', e.target.value)}
                          placeholder="ערך (1.5%, ₪15...)"
                          dir="ltr"
                          className="w-36 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors text-left"
                        />
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-slate-600 hover:text-red-400 p-1.5 rounded transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addRow}
                      className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                    >
                      <Plus size={14} />
                      הוסף שורה
                    </button>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <X size={13} />
                        ביטול
                      </button>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-900/30 transition-colors"
                      >
                        <Check size={13} />
                        שמור
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {saved && (
        <p className="text-emerald-400 text-sm text-center mt-4">✓ נשמר בהצלחה</p>
      )}
    </div>
  )
}
