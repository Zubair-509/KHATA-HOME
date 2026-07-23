import Dexie from 'dexie'

export const db = new Dexie('khata')

db.version(1).stores({
  settings: 'id',
  months: '++id, &monthYear, year, createdAt',
  receipts: '++id, recordId, fieldRef',
})

export const SETTINGS_ID = 'singleton'

export const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  tenant1stFloorName: '1st Floor Tenant',
  tenant2ndFloorName: '2nd Floor Tenant',
  defaultRent1st: 22000,
  defaultRent2nd: 22000,
  ssgcSplitRatio: { ground: 1, first: 1, second: 1 },
  motorSplitRatio: { ground: 1, first: 1, second: 1 },
  onboarded: false,
}

export async function getSettings() {
  const settings = await db.settings.get(SETTINGS_ID)
  return settings || DEFAULT_SETTINGS
}

export async function saveSettings(settings) {
  await db.settings.put({ ...settings, id: SETTINGS_ID })
}

/**
 * Empty bill/payment entry shape: { amount: number, status: 'paid'|'pending', date: string|null, receiptImageRef: string|null }
 */
export function emptyEntry(amount = 0) {
  return { amount, status: 'pending', date: null, receiptImageRef: null }
}

export function emptyMonthRecord(monthYear, year, settings) {
  return {
    monthYear, // e.g. "2026-06"
    year,
    createdAt: new Date().toISOString(),
    status: 'draft',
    snapshot: {
      rents: {
        first: settings.defaultRent1st,
        second: settings.defaultRent2nd,
      },
      splits: {
        ssgc: { ...settings.ssgcSplitRatio },
        motor: { ...settings.motorSplitRatio },
      },
      tenantNames: {
        first: settings.tenant1stFloorName,
        second: settings.tenant2ndFloorName,
      },
    },
    groundFloor: {
      ke: emptyEntry(),
      kwsb: emptyEntry(),
      ssgcTotal: emptyEntry(),
      motorTotal: emptyEntry(),
    },
    firstFloor: {
      ke: emptyEntry(),
      rentReceived: emptyEntry(settings.defaultRent1st),
      ssgcShareReceived: emptyEntry(),
      motorShareReceived: emptyEntry(),
    },
    secondFloor: {
      ke: emptyEntry(),
      rentReceived: emptyEntry(settings.defaultRent2nd),
      ssgcShareReceived: emptyEntry(),
      motorShareReceived: emptyEntry(),
      keReceived: emptyEntry(),
    },
  }
}

export async function listMonths() {
  return db.months.orderBy('monthYear').reverse().toArray()
}

export async function listMonthsByYear(year) {
  return db.months.where('year').equals(year).sortBy('monthYear')
}

export async function getMonth(id) {
  return db.months.get(id)
}

export async function getMonthByKey(monthYear) {
  return db.months.where('monthYear').equals(monthYear).first()
}

export async function saveMonth(record) {
  if (record.id) {
    await db.months.put(record)
    return record.id
  }
  return db.months.add(record)
}

export async function deleteMonth(id) {
  await db.months.delete(id)
}

export async function listYears() {
  const months = await db.months.toArray()
  const years = new Set(months.map((m) => m.year))
  return Array.from(years).sort((a, b) => b - a)
}
