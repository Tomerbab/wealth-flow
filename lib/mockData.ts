import type { FinanceData } from '@/types'

export const CATEGORY_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#14b8a6',
]

export const DEFAULT_MOCK_DATA: FinanceData = {
  categories: [
    // ── Assets ──────────────────────────────────────────────
    { id: 'bank',        name: 'חשבון עו"ש',    color: '#6366f1', type: 'asset'   },
    { id: 'investments', name: 'תיק השקעות',    color: '#10b981', type: 'asset'   },
    { id: 'pension',     name: 'קרן פנסיה',     color: '#f59e0b', type: 'asset'   },
    // ── Incomes ─────────────────────────────────────────────
    { id: 'salary',      name: 'משכורת',        color: '#06b6d4', type: 'income'  },
    { id: 'side_income', name: 'הכנסה צדדית',  color: '#8b5cf6', type: 'income'  },
    // ── Expenses ────────────────────────────────────────────
    { id: 'rent',        name: 'שכירות',        color: '#ef4444', type: 'expense' },
    { id: 'credit_card', name: 'כרטיס אשראי',  color: '#f97316', type: 'expense' },
    { id: 'car',         name: 'רכב',           color: '#ec4899', type: 'expense' },
  ],
  entries: [
    {
      month: '2024-10',
      balances:  { bank: 45000, investments: 180000, pension: 220000 },
      incomes:   { salary: 18000, side_income: 1500 },
      expenses:  { rent: 5000,  credit_card: 3200, car: 1100 },
    },
    {
      month: '2024-11',
      balances:  { bank: 48000, investments: 195000, pension: 228000 },
      incomes:   { salary: 18000, side_income: 2000 },
      expenses:  { rent: 5000,  credit_card: 4100, car: 1100 },
    },
    {
      month: '2024-12',
      balances:  { bank: 42000, investments: 210000, pension: 235000 },
      incomes:   { salary: 19000, side_income: 3500 },
      expenses:  { rent: 5000,  credit_card: 6800, car: 1100 },
    },
    {
      month: '2025-01',
      balances:  { bank: 55000, investments: 205000, pension: 242000 },
      incomes:   { salary: 19000, side_income: 1000 },
      expenses:  { rent: 5200,  credit_card: 3500, car: 1200 },
    },
    {
      month: '2025-02',
      balances:  { bank: 51000, investments: 225000, pension: 250000 },
      incomes:   { salary: 19000, side_income: 2500 },
      expenses:  { rent: 5200,  credit_card: 3800, car: 1200 },
    },
    {
      month: '2025-03',
      balances:  { bank: 60000, investments: 240000, pension: 258000 },
      incomes:   { salary: 19500, side_income: 4000 },
      expenses:  { rent: 5200,  credit_card: 4200, car: 1200 },
    },
    {
      month: '2025-04',
      balances:  { bank: 58000, investments: 255000, pension: 265000 },
      incomes:   { salary: 19500, side_income: 1800 },
      expenses:  { rent: 5200,  credit_card: 3600, car: 1300 },
    },
    {
      month: '2025-05',
      balances:  { bank: 65000, investments: 270000, pension: 272000 },
      incomes:   { salary: 20000, side_income: 2200 },
      expenses:  { rent: 5200,  credit_card: 3900, car: 1300 },
    },
  ],
  fees: {
    bank: {
      'דמי ניהול חשבון':     '₪15 לחודש',
      'עמלת העברה בנקאית':   '₪3 לפעולה',
    },
    investments: {
      'דמי ניהול תיק':       '0.5% לשנה',
      'עמלת קנייה/מכירה':    '0.1%',
    },
    pension: {
      'דמי ניהול מהפקדה':    '1.49%',
      'דמי ניהול מצבירה':    '0.5%',
    },
  },
}
