'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Tags } from 'lucide-react'
import type { Category } from '@/types'
import { CATEGORY_COLORS } from '@/lib/mockData'

interface Props {
  categories: Category[]
  onAdd: (name: string) => void
  onUpdate: (id: string, updates: Partial<Omit<Category, 'id'>>) => void
  onDelete: (id: string) => void
}

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewName('')
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setDeleteConfirm(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    onUpdate(editingId, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-white text-xl font-bold">ניהול קטגוריות</h2>
        <p className="text-slate-400 text-sm mt-1">הגדר את סוגי הנכסים שלך</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
        <h3 className="text-slate-200 text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Plus size={14} className="text-indigo-400" />
          הוספת קטגוריה חדשה
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder='שם (למשל: נדל"ן, קריפטו...)'
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-sm transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            הוסף
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-dashed border-slate-700 rounded-xl">
            <Tags size={30} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">אין קטגוריות עדיין</p>
            <p className="text-slate-600 text-xs mt-0.5">הוסף קטגוריה ראשונה למעלה</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <div>
                    <p className="text-slate-500 text-xs mb-2">בחר צבע</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                            editColor === color
                              ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <X size={13} />
                      ביטול
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!editName.trim()}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-900/30 disabled:opacity-40 transition-colors"
                    >
                      <Check size={13} />
                      שמור
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-white text-sm font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {deleteConfirm === cat.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-xs">מחק בטוח?</span>
                        <button
                          onClick={() => {
                            onDelete(cat.id)
                            setDeleteConfirm(null)
                          }}
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
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          title="ערוך"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cat.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                          title="מחק"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {categories.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-4">
          {categories.length} קטגוריות מוגדרות
        </p>
      )}
    </div>
  )
}
