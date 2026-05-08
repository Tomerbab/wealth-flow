export type CategoryType = 'asset' | 'income' | 'expense'

export interface Category {
  id: string
  name: string
  color: string
  type: CategoryType
}

export interface MonthlyEntry {
  month: string // "YYYY-MM"
  balances: Record<string, number>   // asset categoryId → end-of-month balance
  incomes: Record<string, number>    // income categoryId → amount received this month
  expenses: Record<string, number>   // expense categoryId → amount spent this month
}

// key-value fee pairs, e.g. { "דמי ניהול מהפקדה": "1.49%" }
export type CategoryFees = Record<string, string>

export interface FinanceData {
  categories: Category[]
  entries: MonthlyEntry[]
  fees: Record<string, CategoryFees> // assetId → fees (only assets carry fees)
}
