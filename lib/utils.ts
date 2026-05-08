export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

export const HEBREW_MONTHS_SHORT = [
  'ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני',
  'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ',
]

export function formatMonth(monthStr: string, short = false): string {
  const [year, month] = monthStr.split('-')
  const months = short ? HEBREW_MONTHS_SHORT : HEBREW_MONTHS
  return `${months[parseInt(month) - 1]} ${year}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function totalForBalances(balances: Record<string, number>): number {
  return Object.values(balances).reduce((sum, v) => sum + v, 0)
}
