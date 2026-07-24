import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getMonth, listMonths } from '../lib/db'
import { computeMonthTotals } from '../lib/calculations'
import { formatPKR, MONTH_NAMES } from '../lib/format'
import { Button, Card, Badge } from '../components/ui'

export default function MonthlySummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [exporting, setExporting] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    async function load() {
      const rec = await getMonth(Number(id))
      setRecord(rec)
      if (rec) {
        const months = await listMonths()
        const idx = months.findIndex((m) => m.id === rec.id)
        setPrevious(months[idx + 1] || null)
      }
    }
    load()
  }, [id])

  async function handleExportPdf() {
    if (!printRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#FFFFFF' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`khata-${record.monthYear}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (!record) return <p className="text-neutral-500">Loading…</p>

  const totals = computeMonthTotals(record)
  const [year, monthNum] = record.monthYear.split('-')
  const monthLabel = `${MONTH_NAMES[Number(monthNum) - 1]} ${year}`
  const { snapshot, groundFloor, firstFloor, secondFloor } = record

  const comparison = previous
    ? [
        { name: 'Last Month', inflow: computeMonthTotals(previous).inflow, outflow: computeMonthTotals(previous).outflow, net: computeMonthTotals(previous).net },
        { name: 'This Month', inflow: totals.inflow, outflow: totals.outflow, net: totals.net },
      ]
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-title-xl text-primary-900">Monthly Summary</h1>
        <div className="flex gap-3">
          {record.status === 'finalized' && (
            <Button variant="secondary" onClick={() => navigate(`/new-month?edit=${record.id}`)}>
              Edit (Reopen)
            </Button>
          )}
          <Button onClick={handleExportPdf} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div ref={printRef} className="bg-bg-card border border-neutral-300 rounded-lg p-8 flex flex-col gap-6">
        <header className="text-center border-b border-neutral-300 pb-4">
          <h2 className="font-display text-title-xl text-primary-900">Khata — {monthLabel}</h2>
          <div className="mt-2">
            <Badge status={record.status === 'finalized' ? 'paid' : 'draft'}>
              {record.status === 'finalized' ? 'Finalized' : 'Draft'}
            </Badge>
          </div>
        </header>

        {/* Ground Floor */}
        <section>
          <h3 className="font-display text-title-md text-primary-900 mb-3">Ground Floor (Owner)</h3>
          <BillRow label="KE (Electricity)" entry={groundFloor.ke} />
          <BillRow label="KWSB (Water)" entry={groundFloor.kwsb} />
          <BillRow label="SSGC Total" entry={groundFloor.ssgcTotal} />
          <BillRow label="Motor Total" entry={groundFloor.motorTotal} />
          <ArithmeticLine
            label="Ground Floor Total"
            parts={[
              { value: groundFloor.ke.amount },
              { value: groundFloor.kwsb.amount },
              { value: groundFloor.ssgcTotal.amount },
              { value: groundFloor.motorTotal.amount },
            ]}
            total={totals.groundTotal}
          />
        </section>

        {/* 1st Floor */}
        <section>
          <h3 className="font-display text-title-md text-primary-900 mb-3">
            1st Floor — {snapshot.tenantNames.first}
          </h3>
          <BillRow label="Rent" entry={firstFloor.rentReceived} />
          <BillRow label="Own KE" entry={firstFloor.ke} />
          <BillRow label="SSGC Share" entry={firstFloor.ssgcShareReceived} amountOverride={totals.ssgcShare.first} />
          <BillRow label="Motor Share" entry={firstFloor.motorShareReceived} amountOverride={totals.motorShare.first} />
          <ArithmeticLine
            label="1st Floor Total"
            parts={[
              { value: snapshot.rents.first },
              { value: firstFloor.ke.amount },
              { value: totals.ssgcShare.first },
              { value: totals.motorShare.first },
            ]}
            total={totals.firstFloorTotal}
          />
        </section>

        {/* 2nd Floor */}
        <section>
          <h3 className="font-display text-title-md text-primary-900 mb-3">
            2nd Floor — {snapshot.tenantNames.second}
          </h3>
          <BillRow label="Rent" entry={secondFloor.rentReceived} />
          <BillRow label="KE (Paid by Owner)" entry={secondFloor.ke} />
          <BillRow label="KE Reimbursement" entry={secondFloor.keReceived} />
          <BillRow label="SSGC Share" entry={secondFloor.ssgcShareReceived} amountOverride={totals.ssgcShare.second} />
          <BillRow label="Motor Share" entry={secondFloor.motorShareReceived} amountOverride={totals.motorShare.second} />
          <ArithmeticLine
            label="2nd Floor Total"
            parts={[
              { value: snapshot.rents.second },
              { value: secondFloor.ke.amount },
              { value: totals.ssgcShare.second },
              { value: totals.motorShare.second },
            ]}
            total={totals.secondFloorTotal}
          />
        </section>

        {/* Owner Totals */}
        <section className="border-t border-neutral-300 pt-4">
          <h3 className="font-display text-title-md text-primary-900 mb-3">Owner Totals</h3>
          <div className="flex flex-col gap-1">
            <TotalRow label="Total Inflow" value={totals.inflow} valueClass="text-inflow-text" />
            <TotalRow label="Total Outflow" value={totals.outflow} valueClass="text-outflow-text" />
            <TotalRow label="Net Position" value={totals.net} valueClass="text-primary-900" bold />
          </div>
        </section>

        {/* This month vs last month */}
        {comparison.length > 0 && (
          <section className="border-t border-neutral-300 pt-4">
            <h3 className="font-display text-title-md text-primary-900 mb-3">This Month vs Last Month</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-300)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
                <Tooltip formatter={(value) => formatPKR(value)} />
                <Legend />
                <Bar dataKey="inflow" name="Inflow" fill="var(--chart-inflow)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow" fill="var(--chart-outflow)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="var(--chart-net)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>
    </div>
  )
}

function BillRow({ label, entry, amountOverride }) {
  const amount = amountOverride !== undefined ? amountOverride : entry.amount
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-b-0">
      <span className="text-body-md text-neutral-700">{label}</span>
      <div className="flex items-center gap-3">
        {entry.date && <span className="text-body-sm text-neutral-500">{entry.date}</span>}
        <Badge status={entry.status}>{entry.status}</Badge>
        <span className="font-mono text-mono-md text-neutral-900 w-24 text-right">{formatPKR(amount)}</span>
      </div>
    </div>
  )
}

function ArithmeticLine({ label, parts, total }) {
  const expression = parts.map((p) => Math.round(p.value || 0).toLocaleString('en-PK')).join(' + ')
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 mt-1 bg-primary-50 rounded-md px-3">
      <span className="text-body-md font-semibold text-primary-900">{label}</span>
      <span className="font-mono text-mono-md text-primary-900">
        {expression} = {formatPKR(total)}
      </span>
    </div>
  )
}

function TotalRow({ label, value, valueClass, bold }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-body-lg font-semibold text-neutral-700">{label}</span>
      <span className={`font-mono ${bold ? 'text-mono-lg' : 'text-mono-md'} ${valueClass}`}>{formatPKR(value)}</span>
    </div>
  )
}
