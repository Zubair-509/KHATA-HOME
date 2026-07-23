export function formatPKR(amount) {
  const value = Math.round(amount || 0)
  return `PKR ${value.toLocaleString('en-PK')}`
}

export function formatMonthYear(monthYear) {
  // monthYear stored as "YYYY-MM"
  const [year, month] = monthYear.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
