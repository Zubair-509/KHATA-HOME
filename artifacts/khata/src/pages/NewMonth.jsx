import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMonth, getMonthByKey, saveMonth, emptyMonthRecord, getSettings, listMonths } from '../lib/db'
import { computeMonthTotals } from '../lib/calculations'
import { formatPKR, formatMonthYear, monthKey, MONTH_NAMES } from '../lib/format'
import { Button, Card } from '../components/ui'
import EntryField from '../components/EntryField'

export default function NewMonth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved

  useEffect(() => {
    async function load() {
      if (editId) {
        const existing = await getMonth(Number(editId))
        if (existing) {
          setRecord(existing)
          setLoading(false)
          return
        }
      }

      // No edit id — create a fresh draft for the current month, pre-filled
      // from the most recent month's values (FR-2.4) and current settings.
      const now = new Date()
      const key = monthKey(now.getFullYear(), now.getMonth())
      const existingForKey = await getMonthByKey(key)
      if (existingForKey) {
        setRecord(existingForKey)
        setLoading(false)
        return
      }

      const settings = await getSettings()
      const fresh = emptyMonthRecord(key, now.getFullYear(), settings)

      const previous = (await listMonths())[0]
      if (previous) {
        // Pre-fill amounts from previous month, reset status to pending and clear dates
        const carry = (entry) => ({ amount: entry.amount, status: 'pending', date: null, receiptImageRef: null })
        fresh.groundFloor = {
          ke: carry(previous.groundFloor.ke),
          kwsb: carry(previous.groundFloor.kwsb),
          ssgcTotal: carry(previous.groundFloor.ssgcTotal),
          motorTotal: carry(previous.groundFloor.motorTotal),
        }
        fresh.firstFloor = {
          ke: carry(previous.firstFloor.ke),
          rentReceived: carry(previous.firstFloor.rentReceived),
          ssgcShareReceived: carry(previous.firstFloor.ssgcShareReceived),
          motorShareReceived: carry(previous.firstFloor.motorShareReceived),
        }
        fresh.secondFloor = {
          ke: carry(previous.secondFloor.ke),
          rentReceived: carry(previous.secondFloor.rentReceived),
          ssgcShareReceived: carry(previous.secondFloor.ssgcShareReceived),
          motorShareReceived: carry(previous.secondFloor.motorShareReceived),
          keReceived: carry(previous.secondFloor.keReceived),
        }
      }

      const id = await saveMonth(fresh)
      setRecord({ ...fresh, id })
      setLoading(false)
    }
    load()
  }, [editId])

  // Auto-save on every change (FR-2.8 / Reliability requirement)
  const persist = useCallback(async (next) => {
    setSaveState('saving')
    await saveMonth(next)
    setSaveState('saved')
  }, [])

  function updateFloor(floorKey, fieldKey, value) {
    setRecord((prev) => {
      const next = {
        ...prev,
        [floorKey]: { ...prev[floorKey], [fieldKey]: value },
      }
      persist(next)
      return next
    })
  }

  async function handleFinalize() {
    const next = { ...record, status: 'finalized' }
    await saveMonth(next)
    navigate(`/history/${record.id}`)
  }

  if (loading || !record) {
    return <p className="text-neutral-500">Loading…</p>
  }

  const totals = computeMonthTotals(record)
  const [year, monthNum] = record.monthYear.split('-')
  const monthLabel = `${MONTH_NAMES[Number(monthNum) - 1]} ${year}`
  const { snapshot } = record

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-title-xl text-primary-900">New Month Entry — {monthLabel}</h1>
        <span className="text-body-sm text-neutral-500">
          {saveState === 'saving' ? 'Saving…' : 'All changes saved'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: form */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="font-display text-title-md text-primary-900 mb-2">Ground Floor (Owner)</h2>
            <p className="text-body-sm text-neutral-500 mb-2">
              KE Bill, KWSB Bill, and the full SSGC / Motor bills before splitting.
            </p>
            <EntryField label="KE (Electricity)" value={record.groundFloor.ke} onChange={(v) => updateFloor('groundFloor', 'ke', v)} recordId={record.id} fieldRef="groundFloor.ke" />
            <EntryField label="KWSB (Water)" value={record.groundFloor.kwsb} onChange={(v) => updateFloor('groundFloor', 'kwsb', v)} recordId={record.id} fieldRef="groundFloor.kwsb" />
            <EntryField label="SSGC Total (Full Bill)" value={record.groundFloor.ssgcTotal} onChange={(v) => updateFloor('groundFloor', 'ssgcTotal', v)} recordId={record.id} fieldRef="groundFloor.ssgcTotal" />
            <EntryField label="Motor Total (Full Bill)" value={record.groundFloor.motorTotal} onChange={(v) => updateFloor('groundFloor', 'motorTotal', v)} recordId={record.id} fieldRef="groundFloor.motorTotal" />
          </Card>

          <Card>
            <h2 className="font-display text-title-md text-primary-900 mb-2">
              1st Floor — {snapshot.tenantNames.first}
            </h2>
            <p className="text-body-sm text-neutral-500 mb-2">
              Rent: {formatPKR(snapshot.rents.first)} · SSGC share: {formatPKR(totals.ssgcShare.first)} · Motor share: {formatPKR(totals.motorShare.first)}
            </p>
            <EntryField label="Own KE (Electricity)" value={record.firstFloor.ke} onChange={(v) => updateFloor('firstFloor', 'ke', v)} recordId={record.id} fieldRef="firstFloor.ke" />
            <EntryField label="Rent Received" value={record.firstFloor.rentReceived} onChange={(v) => updateFloor('firstFloor', 'rentReceived', v)} recordId={record.id} fieldRef="firstFloor.rentReceived" />
            <EntryField label="SSGC Share Received" value={record.firstFloor.ssgcShareReceived} onChange={(v) => updateFloor('firstFloor', 'ssgcShareReceived', v)} recordId={record.id} fieldRef="firstFloor.ssgcShareReceived" />
            <EntryField label="Motor Share Received" value={record.firstFloor.motorShareReceived} onChange={(v) => updateFloor('firstFloor', 'motorShareReceived', v)} recordId={record.id} fieldRef="firstFloor.motorShareReceived" />
          </Card>

          <Card>
            <h2 className="font-display text-title-md text-primary-900 mb-2">
              2nd Floor — {snapshot.tenantNames.second}
            </h2>
            <p className="text-body-sm text-neutral-500 mb-2">
              Rent: {formatPKR(snapshot.rents.second)} · SSGC share: {formatPKR(totals.ssgcShare.second)} · Motor share: {formatPKR(totals.motorShare.second)}
            </p>
            <EntryField label="KE (Paid by Owner)" value={record.secondFloor.ke} onChange={(v) => updateFloor('secondFloor', 'ke', v)} recordId={record.id} fieldRef="secondFloor.ke" />
            <EntryField label="KE Reimbursement Received" value={record.secondFloor.keReceived} onChange={(v) => updateFloor('secondFloor', 'keReceived', v)} recordId={record.id} fieldRef="secondFloor.keReceived" />
            <EntryField label="Rent Received" value={record.secondFloor.rentReceived} onChange={(v) => updateFloor('secondFloor', 'rentReceived', v)} recordId={record.id} fieldRef="secondFloor.rentReceived" />
            <EntryField label="SSGC Share Received" value={record.secondFloor.ssgcShareReceived} onChange={(v) => updateFloor('secondFloor', 'ssgcShareReceived', v)} recordId={record.id} fieldRef="secondFloor.ssgcShareReceived" />
            <EntryField label="Motor Share Received" value={record.secondFloor.motorShareReceived} onChange={(v) => updateFloor('secondFloor', 'motorShareReceived', v)} recordId={record.id} fieldRef="secondFloor.motorShareReceived" />
          </Card>
        </div>

        {/* Right: live summary */}
        <div className="lg:sticky lg:top-6 self-start">
          <Card>
            <h2 className="font-display text-title-md text-primary-900 mb-4">Live Summary</h2>
            <SummaryRow label="1st Floor Total" value={totals.firstFloorTotal} />
            <SummaryRow label="2nd Floor Total" value={totals.secondFloorTotal} />
            <SummaryRow label="Ground Floor Total" value={totals.groundTotal} />
            <div className="border-t border-neutral-300 my-3" />
            <SummaryRow label="Total Inflow (Paid)" value={totals.inflow} valueClass="text-inflow-text" />
            <SummaryRow label="Total Outflow (Paid)" value={totals.outflow} valueClass="text-outflow-text" />
            <SummaryRow label="Net Position" value={totals.net} valueClass="text-primary-900" bold />
            <div className="border-t border-neutral-300 my-3" />
            <div className="text-body-md text-neutral-700">
              {totals.pendingCount} pending item{totals.pendingCount === 1 ? '' : 's'}
            </div>

            <Button className="mt-6 w-full" onClick={handleFinalize} disabled={record.status === 'finalized'}>
              {record.status === 'finalized' ? 'Finalized' : 'Finalize Month'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-neutral-900', bold = false }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-body-md text-neutral-700">{label}</span>
      <span className={`font-mono ${bold ? 'text-mono-lg' : 'text-mono-md'} ${valueClass}`}>{formatPKR(value)}</span>
    </div>
  )
}
