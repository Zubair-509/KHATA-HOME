import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listMonths, listYears } from '../lib/db'
import { computeMonthTotals } from '../lib/calculations'
import { formatPKR, formatMonthYear } from '../lib/format'
import { Card, Badge } from '../components/ui'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [months, setMonths] = useState([])
  const [years, setYears] = useState([])
  const [yearFilter, setYearFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setMonths(await listMonths())
      setYears(await listYears())
    }
    load()
  }, [])

  const filtered = yearFilter === 'all' ? months : months.filter((m) => m.year === yearFilter)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-xl text-primary-900">History</h1>

      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All Years" active={yearFilter === 'all'} onClick={() => setYearFilter('all')} />
          {years.map((y) => (
            <FilterChip key={y} label={String(y)} active={yearFilter === y} onClick={() => setYearFilter(y)} />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <p className="text-body-md text-neutral-500">No months recorded yet.</p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden sm:block p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-label uppercase text-neutral-500 border-b border-neutral-300">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Inflow</th>
                  <th className="py-3 px-4">Outflow</th>
                  <th className="py-3 px-4">Net</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const t = computeMonthTotals(m)
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-neutral-100 h-14 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => navigate(`/history/${m.id}`)}
                    >
                      <td className="px-4 font-body text-body-md">{formatMonthYear(m.monthYear)}</td>
                      <td className="px-4 font-mono text-mono-md text-inflow-text">{formatPKR(t.inflow)}</td>
                      <td className="px-4 font-mono text-mono-md text-outflow-text">{formatPKR(t.outflow)}</td>
                      <td className="px-4 font-mono text-mono-md text-primary-900">{formatPKR(t.net)}</td>
                      <td className="px-4">
                        <Badge status={m.status === 'finalized' ? 'paid' : 'draft'}>
                          {m.status === 'finalized' ? 'Finalized' : 'Draft'}
                        </Badge>
                        {t.pendingCount > 0 && (
                          <span className="ml-2">
                            <Badge status="pending">{t.pendingCount} pending</Badge>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((m) => {
              const t = computeMonthTotals(m)
              return (
                <Card key={m.id} onClick={() => navigate(`/history/${m.id}`)} className="cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-title-md text-primary-900">{formatMonthYear(m.monthYear)}</span>
                    <Badge status={m.status === 'finalized' ? 'paid' : 'draft'}>
                      {m.status === 'finalized' ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-body-sm">
                    <Row label="Inflow" value={t.inflow} cls="text-inflow-text" />
                    <Row label="Outflow" value={t.outflow} cls="text-outflow-text" />
                    <Row label="Net" value={t.net} cls="text-primary-900" />
                    {t.pendingCount > 0 && <Badge status="pending">{t.pendingCount} pending</Badge>}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, cls }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-mono ${cls}`}>{formatPKR(value)}</span>
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-body-sm font-semibold border transition-colors duration-fast ${
        active
          ? 'bg-primary-900 text-white border-primary-900'
          : 'bg-white text-primary-900 border-neutral-300 hover:bg-neutral-100'
      }`}
    >
      {label}
    </button>
  )
}
