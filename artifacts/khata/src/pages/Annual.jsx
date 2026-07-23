import { useEffect, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { listYears } from '../lib/db'
import { computeYearlyTotals } from '../lib/calculations'
import { formatPKR, formatMonthYear } from '../lib/format'
import { Button, Card, Badge, Select } from '../components/ui'

export default function Annual() {
  const printRef = useRef(null)
  const [years, setYears] = useState([])
  const [year, setYear] = useState(null)
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      const ys = await listYears()
      setYears(ys)
      if (ys.length > 0) setYear(ys[0])
    }
    load()
  }, [])

  useEffect(() => {
    if (year == null) return
    async function load() {
      const result = await computeYearlyTotals(year)
      setData(result)
    }
    load()
  }, [year])

  async function handleExportPdf() {
    if (!printRef.current || !data) return
    setExporting(true)
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#FFFFFF' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`khata-annual-${year}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (years.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-title-xl text-primary-900">Annual Summary</h1>
        <Card>
          <p className="text-body-md text-neutral-500">No months recorded yet.</p>
        </Card>
      </div>
    )
  }

  const chartData = data
    ? data.monthly.map((m) => ({
        name: formatMonthYear(m.monthYear).split(' ')[0],
        inflow: m.inflow,
        outflow: m.outflow,
        net: m.net,
        monthYear: m.monthYear,
      }))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-title-xl text-primary-900">Annual Summary</h1>
        <div className="flex items-center gap-3">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          {data && (
            <Button onClick={handleExportPdf} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
          )}
        </div>
      </div>

      {data && (
        <div ref={printRef} className="flex flex-col gap-6 bg-bg-base p-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
              <div className="text-label uppercase text-neutral-500">Total Inflow</div>
              <div className="font-mono text-title-xl text-inflow-text mt-2">{formatPKR(data.totals.inflow)}</div>
            </Card>
            <Card>
              <div className="text-label uppercase text-neutral-500">Total Outflow</div>
              <div className="font-mono text-title-xl text-outflow-text mt-2">{formatPKR(data.totals.outflow)}</div>
            </Card>
            <Card>
              <div className="text-label uppercase text-neutral-500">Total Net</div>
              <div className="font-mono text-title-xl text-primary-900 mt-2">{formatPKR(data.totals.net)}</div>
            </Card>
          </div>

          <Card>
            <h3 className="font-display text-title-md text-primary-900 mb-4">{year} — Monthly Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
          </Card>

          <Card>
            <h3 className="font-display text-title-md text-primary-900 mb-4">Per-Floor Yearly Totals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Row label="Ground Floor (Owner) Total" value={data.perFloor.groundTotal} />
              <Row label="1st Floor Total" value={data.perFloor.firstFloorTotal} />
              <Row label="2nd Floor Total" value={data.perFloor.secondFloorTotal} />
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-label uppercase text-neutral-500 border-b border-neutral-300">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Inflow</th>
                  <th className="py-3 px-4">Outflow</th>
                  <th className="py-3 px-4">Net</th>
                  <th className="py-3 px-4">Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m) => (
                  <tr key={m.monthYear} className="border-b border-neutral-100 h-14">
                    <td className="px-4 font-body text-body-md">{formatMonthYear(m.monthYear)}</td>
                    <td className="px-4 font-mono text-mono-md text-inflow-text">{formatPKR(m.inflow)}</td>
                    <td className="px-4 font-mono text-mono-md text-outflow-text">{formatPKR(m.outflow)}</td>
                    <td className="px-4 font-mono text-mono-md text-primary-900">{formatPKR(m.net)}</td>
                    <td className="px-4">
                      {m.pendingCount > 0 ? <Badge status="pending">{m.pendingCount}</Badge> : <span className="text-neutral-500">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body-sm text-neutral-500">{label}</span>
      <span className="font-mono text-mono-lg text-primary-900">{formatPKR(value)}</span>
    </div>
  )
}
