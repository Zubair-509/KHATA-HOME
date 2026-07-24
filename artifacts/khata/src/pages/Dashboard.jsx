import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, PieChart as PieIcon, AlertTriangle } from 'lucide-react'
import { listMonths, getMonthByKey, saveMonth, emptyMonthRecord, getSettings } from '../lib/db'
import { computeMonthTotals, getRecentMonthsTrend } from '../lib/calculations'
import { formatPKR, formatMonthYear, monthKey } from '../lib/format'
import { Button, Card, StatCard, Badge } from '../components/ui'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [currentTotals, setCurrentTotals] = useState(null)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [trend, setTrend] = useState([])
  const [recentMonths, setRecentMonths] = useState([])

  const now = new Date()
  const thisMonthKey = monthKey(now.getFullYear(), now.getMonth())

  useEffect(() => {
    async function load() {
      const months = await listMonths() // newest first
      setRecentMonths(months.slice(0, 6))

      const current = months[0]
      if (current) {
        setCurrentRecord(current)
        setCurrentTotals(computeMonthTotals(current))
      }

      const trendData = await getRecentMonthsTrend(6)
      setTrend(trendData.map((m) => ({ ...m, label: formatMonthYear(m.monthYear) })))

      setLoading(false)
    }
    load()
  }, [])

  async function handleStartOrContinue() {
    const existing = await getMonthByKey(thisMonthKey)
    if (existing) {
      navigate(`/new-month?edit=${existing.id}`)
      return
    }
    const settings = await getSettings()
    const record = emptyMonthRecord(thisMonthKey, now.getFullYear(), settings)
    const id = await saveMonth(record)
    navigate(`/new-month?edit=${id}`)
  }

  const hasCurrentMonth = currentRecord && currentRecord.monthYear === thisMonthKey
  const ctaLabel = hasCurrentMonth ? 'Continue This Month' : 'Start New Month'

  const donutData = currentTotals
    ? [
        { name: 'Ground (Owner)', value: currentTotals.groundTotal, color: 'var(--chart-outflow)' },
        { name: '1st Floor', value: currentTotals.firstFloorTotal, color: 'var(--chart-inflow)' },
        { name: '2nd Floor', value: currentTotals.secondFloorTotal, color: 'var(--chart-net)' },
      ]
    : []
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // FR-7.1: Show a warning banner after the 25th when there are pending items
  const isPastDue = now.getDate() >= 25 && (currentTotals?.pendingCount ?? 0) > 0

  if (loading) {
    return <p className="text-neutral-500">Loading dashboard…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-xl text-primary-900">Dashboard</h1>

      {/* FR-7.1 Pending banner — shown after the 25th when items are outstanding */}
      {isPastDue && (
        <div className="flex items-start gap-3 bg-pending-bg border border-pending-border rounded-lg px-4 py-3">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-pending-text mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-pending-text">
              {currentTotals.pendingCount} pending item{currentTotals.pendingCount === 1 ? '' : 's'} — month-end approaching
            </p>
            <p className="text-body-sm text-pending-text opacity-80 mt-0.5">
              It's past the 25th. Confirm any outstanding payments before closing this month.
            </p>
          </div>
          <button
            onClick={handleStartOrContinue}
            className="text-body-sm font-semibold text-pending-text underline shrink-0 hover:opacity-70 transition-opacity"
          >
            Go to entry →
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Inflow (This Month)"
          value={formatPKR(currentTotals?.inflow || 0)}
          ariaLabel={`Total inflow this month: ${currentTotals?.inflow || 0} rupees`}
        />
        <StatCard
          label="Total Outflow (This Month)"
          value={formatPKR(currentTotals?.outflow || 0)}
          sublabel=""
          sublabelClassName="text-outflow-text"
          ariaLabel={`Total outflow this month: ${currentTotals?.outflow || 0} rupees`}
        />
        <StatCard
          label="Net Position"
          value={formatPKR(currentTotals?.net || 0)}
          ariaLabel={`Net position this month: ${currentTotals?.net || 0} rupees`}
        />
        <StatCard
          label="Pending Items"
          value={String(currentTotals?.pendingCount || 0)}
          sublabel={currentTotals?.pendingCount ? 'Needs attention' : 'All clear'}
          sublabelClassName={currentTotals?.pendingCount ? 'text-pending-text' : 'text-inflow-text'}
          ariaLabel={`${currentTotals?.pendingCount || 0} pending items this month`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} strokeWidth={1.5} className="text-primary-500" />
            <h3 className="font-display text-title-md text-primary-900">Income vs Expense Trend</h3>
          </div>
          {trend.length === 0 ? (
            <p className="text-body-md text-neutral-500">No data yet — start your first month to see trends.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-300)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
                <Tooltip formatter={(value) => formatPKR(value)} />
                <Area type="monotone" dataKey="inflow" name="Inflow" stroke="var(--chart-inflow)" fill="var(--chart-inflow)" fillOpacity={0.15} />
                <Area type="monotone" dataKey="outflow" name="Outflow" stroke="var(--chart-outflow)" fill="var(--chart-outflow)" fillOpacity={0.15} />
                <Area type="monotone" dataKey="net" name="Net" stroke="var(--chart-net)" fill="var(--chart-net)" fillOpacity={0.08} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={18} strokeWidth={1.5} className="text-primary-500" />
            <h3 className="font-display text-title-md text-primary-900">Per-Floor Breakdown</h3>
          </div>
          {!currentTotals || donutTotal === 0 ? (
            <p className="text-body-md text-neutral-500">No data yet for this month.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPKR(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <div className="text-label uppercase text-neutral-500">Total Building Expense</div>
                <div className="font-mono text-mono-lg text-primary-900">{formatPKR(donutTotal)}</div>
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-3 text-body-sm text-neutral-700">
                {donutData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* CTA */}
      <div>
        <Button onClick={handleStartOrContinue}>{ctaLabel}</Button>
      </div>

      {/* Recent months */}
      <Card>
        <h3 className="font-display text-title-md text-primary-900 mb-4">Recent Months</h3>
        {recentMonths.length === 0 ? (
          <p className="text-body-md text-neutral-500">No months recorded yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="text-left text-label uppercase text-neutral-500 border-b border-neutral-300">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2 pr-4">Inflow</th>
                  <th className="py-2 pr-4">Outflow</th>
                  <th className="py-2 pr-4">Net</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMonths.map((m) => {
                  const t = computeMonthTotals(m)
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-neutral-100 h-14 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => navigate(`/history/${m.id}`)}
                    >
                      <td className="font-body text-body-md">{formatMonthYear(m.monthYear)}</td>
                      <td className="font-mono text-mono-md text-inflow-text">{formatPKR(t.inflow)}</td>
                      <td className="font-mono text-mono-md text-outflow-text">{formatPKR(t.outflow)}</td>
                      <td className="font-mono text-mono-md text-primary-900">{formatPKR(t.net)}</td>
                      <td>
                        <Badge status={m.status === 'finalized' ? 'paid' : 'draft'}>
                          {m.status === 'finalized' ? 'Finalized' : 'Draft'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile stacked cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {recentMonths.map((m) => {
                const t = computeMonthTotals(m)
                return (
                  <div
                    key={m.id}
                    className="border border-neutral-300 rounded-md p-4"
                    onClick={() => navigate(`/history/${m.id}`)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display text-title-md text-primary-900">{formatMonthYear(m.monthYear)}</span>
                      <Badge status={m.status === 'finalized' ? 'paid' : 'draft'}>
                        {m.status === 'finalized' ? 'Finalized' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span>Inflow: <span className="font-mono text-inflow-text">{formatPKR(t.inflow)}</span></span>
                      <span>Outflow: <span className="font-mono text-outflow-text">{formatPKR(t.outflow)}</span></span>
                      <span>Net: <span className="font-mono text-primary-900">{formatPKR(t.net)}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
