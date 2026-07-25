/**
 * API client — replaces the old Dexie (lib/db.js) interface.
 * All data now lives in PostgreSQL via the Express API server.
 * The same function signatures are preserved so page code changes are minimal.
 */

const API_BASE = '/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  })
  if (res.status === 204) return null
  if (res.status === 404) return null
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Default values (pure helpers, no DB) ─────────────────────────────────

export const DEFAULT_SETTINGS = {
  tenant1stFloorName: '1st Floor Tenant',
  tenant2ndFloorName: '2nd Floor Tenant',
  defaultRent1st: 22000,
  defaultRent2nd: 22000,
  ssgcSplitRatio: { ground: 1, first: 1, second: 1 },
  motorSplitRatio: { ground: 1, first: 1, second: 1 },
  onboarded: false,
}

/** Empty bill/payment entry: { amount, status, date, receiptImageRef } */
export function emptyEntry(amount = 0) {
  return { amount, status: 'pending', date: null, receiptImageRef: null }
}

/** Build a fresh month record pre-filled from current settings. */
export function emptyMonthRecord(monthYear, year, s) {
  return {
    monthYear,
    year,
    createdAt: new Date().toISOString(),
    status: 'draft',
    snapshot: {
      rents: { first: s.defaultRent1st, second: s.defaultRent2nd },
      splits: {
        ssgc: { ...s.ssgcSplitRatio },
        motor: { ...s.motorSplitRatio },
      },
      tenantNames: {
        first: s.tenant1stFloorName,
        second: s.tenant2ndFloorName,
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
      rentReceived: emptyEntry(s.defaultRent1st),
      ssgcShareReceived: emptyEntry(),
      motorShareReceived: emptyEntry(),
    },
    secondFloor: {
      ke: emptyEntry(),
      rentReceived: emptyEntry(s.defaultRent2nd),
      ssgcShareReceived: emptyEntry(),
      motorShareReceived: emptyEntry(),
      keReceived: emptyEntry(),
    },
  }
}

// ── Settings ──────────────────────────────────────────────────────────────

export async function getSettings() {
  const data = await apiFetch('/settings')
  return data ?? DEFAULT_SETTINGS
}

export async function saveSettings(s) {
  return apiFetch('/settings', { method: 'PUT', body: JSON.stringify(s) })
}

// ── Monthly Records ───────────────────────────────────────────────────────

/** All records, newest first. */
export async function listMonths() {
  return (await apiFetch('/records')) ?? []
}

/** Records for a specific year, oldest first. */
export async function listMonthsByYear(year) {
  return (await apiFetch(`/records/year/${year}`)) ?? []
}

/** Get a record by UUID. */
export async function getMonth(id) {
  return apiFetch(`/records/${id}`)
}

/** Get a record by monthYear key (e.g. "2026-06"). Returns null if not found. */
export async function getMonthByKey(monthYear) {
  return apiFetch(`/records/month/${monthYear}`)
}

/**
 * Save a record. If record.id exists, updates it; otherwise creates.
 * Returns the record id (UUID string).
 */
export async function saveMonth(record) {
  if (record.id) {
    const updated = await apiFetch(`/records/${record.id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    })
    return updated?.id ?? record.id
  }
  const created = await apiFetch('/records', {
    method: 'POST',
    body: JSON.stringify(record),
  })
  return created?.id
}

export async function deleteMonth(id) {
  await apiFetch(`/records/${id}`, { method: 'DELETE' })
}

/** Distinct years across all records, newest first. */
export async function listYears() {
  return (await apiFetch('/records/years')) ?? []
}

// ── Receipts ──────────────────────────────────────────────────────────────

/** Convert a File/Blob to a full data URL ("data:image/jpeg;base64,..."). */
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Save or replace a receipt image for a specific entry.
 * imageFile is a File (from <input type="file">).
 */
export async function saveReceipt(recordId, fieldRef, imageFile) {
  const imageData = await fileToDataUrl(imageFile)
  return apiFetch(
    `/records/${recordId}/receipts/${encodeURIComponent(fieldRef)}`,
    { method: 'PUT', body: JSON.stringify({ imageData }) },
  )
}

/**
 * Get a receipt. Returns { imageData: dataUrl } or undefined if not found.
 * imageData is a full data URL suitable for use as an <img> src.
 */
export async function getReceipt(recordId, fieldRef) {
  const data = await apiFetch(
    `/records/${recordId}/receipts/${encodeURIComponent(fieldRef)}`,
  )
  return data ?? undefined
}

/** Delete a receipt image. */
export async function deleteReceipt(recordId, fieldRef) {
  await apiFetch(
    `/records/${recordId}/receipts/${encodeURIComponent(fieldRef)}`,
    { method: 'DELETE' },
  )
}

/** No-op: cascade delete on monthly_records handles receipt cleanup server-side. */
export async function deleteMonthReceipts(_recordId) {}

// ── Data management ───────────────────────────────────────────────────────

/** Export all user data as a JSON blob download. */
export async function exportAllData() {
  const [settingsData, months] = await Promise.all([getSettings(), listMonths()])
  const data = { settings: settingsData, months, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `khata-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
