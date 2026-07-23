import { listMonths, listMonthsByYear } from './db'

function ratioShare(total, ratio, floor) {
  const sum = (ratio.ground || 0) + (ratio.first || 0) + (ratio.second || 0)
  if (sum === 0) return 0
  return (total * (ratio[floor] || 0)) / sum
}

function amt(entry) {
  return entry?.amount || 0
}

function isPaid(entry) {
  return entry?.status === 'paid'
}

/**
 * Computes all derived totals for a single monthly record.
 * Per FR-3.1 to FR-3.7. "Actual" inflow/outflow only counts entries marked Paid;
 * Pending entries are surfaced via pendingItems/pendingCount instead.
 */
export function computeMonthTotals(record) {
  const { groundFloor, firstFloor, secondFloor, snapshot } = record

  const ssgcShare = {
    first: ratioShare(amt(groundFloor.ssgcTotal), snapshot.splits.ssgc, 'first'),
    second: ratioShare(amt(groundFloor.ssgcTotal), snapshot.splits.ssgc, 'second'),
  }
  const motorShare = {
    first: ratioShare(amt(groundFloor.motorTotal), snapshot.splits.motor, 'first'),
    second: ratioShare(amt(groundFloor.motorTotal), snapshot.splits.motor, 'second'),
  }

  // FR-3.3 / FR-3.4 — expected floor totals (what each tenant owes this month)
  const firstFloorTotal = snapshot.rents.first + amt(firstFloor.ke) + ssgcShare.first + motorShare.first
  const secondFloorTotal = snapshot.rents.second + amt(secondFloor.ke) + ssgcShare.second + motorShare.second

  // FR-3.5 — Owner Inflow = sum of amounts actually received (Paid) from tenants
  const inflowEntries = [
    firstFloor.rentReceived,
    firstFloor.ssgcShareReceived,
    firstFloor.motorShareReceived,
    secondFloor.rentReceived,
    secondFloor.ssgcShareReceived,
    secondFloor.motorShareReceived,
    secondFloor.keReceived,
  ]
  const inflow = inflowEntries.filter(isPaid).reduce((sum, e) => sum + amt(e), 0)

  // FR-3.6 — Owner Outflow = Ground KE + KWSB + full SSGC + full Motor + 2nd Floor KE (Paid only)
  const outflowEntries = [groundFloor.ke, groundFloor.kwsb, groundFloor.ssgcTotal, groundFloor.motorTotal, secondFloor.ke]
  const outflow = outflowEntries.filter(isPaid).reduce((sum, e) => sum + amt(e), 0)

  // FR-3.7
  const net = inflow - outflow

  // Pending items across the whole record
  const pendingItems = []
  const pushPending = (floorLabel, fieldLabel, entry) => {
    if (entry && entry.status === 'pending' && amt(entry) > 0) {
      pendingItems.push({ floor: floorLabel, field: fieldLabel, amount: amt(entry), date: entry.date })
    }
  }
  pushPending('Ground', 'KE', groundFloor.ke)
  pushPending('Ground', 'KWSB', groundFloor.kwsb)
  pushPending('Ground', 'SSGC', groundFloor.ssgcTotal)
  pushPending('Ground', 'Motor', groundFloor.motorTotal)
  pushPending('1st Floor', 'KE', firstFloor.ke)
  pushPending('1st Floor', 'Rent', firstFloor.rentReceived)
  pushPending('1st Floor', 'SSGC Share', firstFloor.ssgcShareReceived)
  pushPending('1st Floor', 'Motor Share', firstFloor.motorShareReceived)
  pushPending('2nd Floor', 'KE', secondFloor.ke)
  pushPending('2nd Floor', 'Rent', secondFloor.rentReceived)
  pushPending('2nd Floor', 'SSGC Share', secondFloor.ssgcShareReceived)
  pushPending('2nd Floor', 'Motor Share', secondFloor.motorShareReceived)
  pushPending('2nd Floor', 'KE (paid by owner)', secondFloor.keReceived)

  // Per-floor expense breakdown (DDS 6.2): Ground = owner outflow, plus floor totals
  const groundTotal = amt(groundFloor.ke) + amt(groundFloor.kwsb) + amt(groundFloor.ssgcTotal) + amt(groundFloor.motorTotal)

  return {
    ssgcShare,
    motorShare,
    firstFloorTotal,
    secondFloorTotal,
    groundTotal,
    inflow,
    outflow,
    net,
    pendingItems,
    pendingCount: pendingItems.length,
  }
}

/**
 * Aggregates totals across an entire year, plus a per-month breakdown
 * suitable for the Annual Summary 12-month bar chart (DDS 6.3).
 */
export async function computeYearlyTotals(year) {
  const months = await listMonthsByYear(year)

  const monthly = months.map((record) => {
    const totals = computeMonthTotals(record)
    return {
      monthYear: record.monthYear,
      ...totals,
    }
  })

  const totals = monthly.reduce(
    (acc, m) => ({
      inflow: acc.inflow + m.inflow,
      outflow: acc.outflow + m.outflow,
      net: acc.net + m.net,
    }),
    { inflow: 0, outflow: 0, net: 0 }
  )

  // Per-floor yearly totals (FR-5.6)
  const perFloor = months.reduce(
    (acc, record) => {
      const t = computeMonthTotals(record)
      acc.firstFloorTotal += t.firstFloorTotal
      acc.secondFloorTotal += t.secondFloorTotal
      acc.groundTotal += t.groundTotal
      return acc
    },
    { firstFloorTotal: 0, secondFloorTotal: 0, groundTotal: 0 }
  )

  return { year, monthly, totals, perFloor }
}

/**
 * Returns the last `count` months (chronological order) mapped through
 * computeMonthTotals, for the Dashboard Income vs Expense trend chart.
 */
export async function getRecentMonthsTrend(count = 6) {
  const months = await listMonths() // newest first
  const recent = months.slice(0, count).reverse()
  return recent.map((record) => ({
    monthYear: record.monthYear,
    ...computeMonthTotals(record),
  }))
}
