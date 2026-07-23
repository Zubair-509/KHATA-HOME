import { useEffect, useState } from 'react'
import { db, getSettings, saveSettings } from '../lib/db'
import { Button, Card, FormField, Input } from '../components/ui'

export default function SettingsPage() {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then((settings) =>
      setForm({
        tenant1stFloorName: settings.tenant1stFloorName,
        tenant2ndFloorName: settings.tenant2ndFloorName,
        defaultRent1st: settings.defaultRent1st,
        defaultRent2nd: settings.defaultRent2nd,
        ssgcGround: settings.ssgcSplitRatio.ground,
        ssgcFirst: settings.ssgcSplitRatio.first,
        ssgcSecond: settings.ssgcSplitRatio.second,
        motorGround: settings.motorSplitRatio.ground,
        motorFirst: settings.motorSplitRatio.first,
        motorSecond: settings.motorSplitRatio.second,
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
    const [settings, months, receipts] = await Promise.all([
      db.settings.toArray(),
      db.months.toArray(),
      db.receipts.toArray(),
    ])
    const data = { settings, months, receipts, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khata-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClearData() {
    if (!window.confirm('This will permanently delete all months, receipts, and settings. Continue?')) return
    await db.months.clear()
    await db.receipts.clear()
    await db.settings.clear()
    window.location.reload()
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
          <Button type="button" variant="danger" onClick={handleClearData}>
            Clear All Data
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-title-md text-primary-900 mb-2">About</h2>
        <p className="text-body-md text-neutral-700">
          Khata — Your Building's Ledger, On the Web. Version 1.0. All data is stored locally in
          your browser; nothing is sent to a server.
        </p>
      </Card>
    </div>
  )
}
