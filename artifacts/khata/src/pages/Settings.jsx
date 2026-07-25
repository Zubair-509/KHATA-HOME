import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/react'
import { getSettings, saveSettings, exportAllData } from '../lib/api'
import { Button, Card, FormField, Input } from '../components/ui'

export default function SettingsPage() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    getSettings().then((s) =>
      setForm({
        tenant1stFloorName: s.tenant1stFloorName,
        tenant2ndFloorName: s.tenant2ndFloorName,
        defaultRent1st: s.defaultRent1st,
        defaultRent2nd: s.defaultRent2nd,
        ssgcGround: s.ssgcSplitRatio.ground,
        ssgcFirst: s.ssgcSplitRatio.first,
        ssgcSecond: s.ssgcSplitRatio.second,
        motorGround: s.motorSplitRatio.ground,
        motorFirst: s.motorSplitRatio.first,
        motorSecond: s.motorSplitRatio.second,
      })
    )
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await saveSettings({
      tenant1stFloorName: form.tenant1stFloorName,
      tenant2ndFloorName: form.tenant2ndFloorName,
      defaultRent1st: Number(form.defaultRent1st) || 0,
      defaultRent2nd: Number(form.defaultRent2nd) || 0,
      ssgcSplitRatio: {
        ground: Number(form.ssgcGround) || 0,
        first: Number(form.ssgcFirst) || 0,
        second: Number(form.ssgcSecond) || 0,
      },
      motorSplitRatio: {
        ground: Number(form.motorGround) || 0,
        first: Number(form.motorFirst) || 0,
        second: Number(form.motorSecond) || 0,
      },
      onboarded: true,
    })
    setSaved(true)
  }

  async function handleExport() {
    await exportAllData()
  }

  async function handleClearData() {
    if (!window.confirm('This will permanently delete ALL your months, receipts, and settings. This cannot be undone. Continue?')) return
    setClearing(true)
    try {
      // Delete all records via API (receipts cascade); then reset settings
      const { listMonths, deleteMonth, saveSettings: resetSettings } = await import('../lib/api')
      const months = await listMonths()
      await Promise.all(months.map((m) => deleteMonth(m.id)))
      await resetSettings({
        tenant1stFloorName: '1st Floor Tenant',
        tenant2ndFloorName: '2nd Floor Tenant',
        defaultRent1st: 22000,
        defaultRent2nd: 22000,
        ssgcSplitRatio: { ground: 1, first: 1, second: 1 },
        motorSplitRatio: { ground: 1, first: 1, second: 1 },
        onboarded: false,
      })
      window.location.href = '/'
    } catch (err) {
      alert('Failed to clear data. Please try again.')
      setClearing(false)
    }
  }

  if (!form) return <p className="text-neutral-500">Loading…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-xl text-primary-900">Settings</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="font-display text-title-md text-primary-900 mb-4">Tenants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="1st Floor Tenant Name">
              <Input value={form.tenant1stFloorName} onChange={(e) => update('tenant1stFloorName', e.target.value)} />
            </FormField>
            <FormField label="2nd Floor Tenant Name">
              <Input value={form.tenant2ndFloorName} onChange={(e) => update('tenant2ndFloorName', e.target.value)} />
            </FormField>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-title-md text-primary-900 mb-4">Default Rent</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="1st Floor (PKR)">
              <Input type="number" min="0" value={form.defaultRent1st} onChange={(e) => update('defaultRent1st', e.target.value)} />
            </FormField>
            <FormField label="2nd Floor (PKR)">
              <Input type="number" min="0" value={form.defaultRent2nd} onChange={(e) => update('defaultRent2nd', e.target.value)} />
            </FormField>
          </div>
          <p className="text-body-sm text-neutral-500 mt-3">
            Changes apply only to new months — past months remain unchanged.
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-title-md text-primary-900 mb-4">Bill Splits</h2>
          <p className="text-body-sm text-neutral-500 mb-3">SSGC split ratio (Ground / 1st / 2nd)</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <FormField label="Ground">
              <Input type="number" min="0" value={form.ssgcGround} onChange={(e) => update('ssgcGround', e.target.value)} />
            </FormField>
            <FormField label="1st Floor">
              <Input type="number" min="0" value={form.ssgcFirst} onChange={(e) => update('ssgcFirst', e.target.value)} />
            </FormField>
            <FormField label="2nd Floor">
              <Input type="number" min="0" value={form.ssgcSecond} onChange={(e) => update('ssgcSecond', e.target.value)} />
            </FormField>
          </div>
          <p className="text-body-sm text-neutral-500 mb-3">Motor split ratio (Ground / 1st / 2nd)</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Ground">
              <Input type="number" min="0" value={form.motorGround} onChange={(e) => update('motorGround', e.target.value)} />
            </FormField>
            <FormField label="1st Floor">
              <Input type="number" min="0" value={form.motorFirst} onChange={(e) => update('motorFirst', e.target.value)} />
            </FormField>
            <FormField label="2nd Floor">
              <Input type="number" min="0" value={form.motorSecond} onChange={(e) => update('motorSecond', e.target.value)} />
            </FormField>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save Changes</Button>
          {saved && <span className="text-inflow-text text-body-md">Saved.</span>}
        </div>
      </form>

      <Card>
        <h2 className="font-display text-title-md text-primary-900 mb-4">Data</h2>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={handleExport}>
            Export All Data (JSON)
          </Button>
          <Button type="button" variant="danger" onClick={handleClearData} disabled={clearing}>
            {clearing ? 'Clearing…' : 'Clear All Data'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-title-md text-primary-900 mb-2">About</h2>
        <p className="text-body-md text-neutral-700">
          Khata — Your Building's Ledger, On the Web. Version 2.0. All data is stored securely
          in PostgreSQL, accessible from any device after signing in.
        </p>
      </Card>

      <Card>
        <h2 className="font-display text-title-md text-primary-900 mb-4">Account</h2>
        <p className="text-body-md text-neutral-700 mb-5">
          Logged in as:{' '}
          <span className="font-medium text-neutral-900">
            {user?.emailAddresses?.[0]?.emailAddress || user?.fullName || '—'}
          </span>
        </p>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/' })}
          className="border border-outflow-text text-outflow-text rounded-md px-5 h-11 font-medium text-body-md hover:bg-outflow-bg transition-colors duration-fast"
        >
          Log Out
        </button>
      </Card>
    </div>
  )
}
