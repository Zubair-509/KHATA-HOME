import { useState } from 'react'
import { saveSettings, DEFAULT_SETTINGS } from '../lib/db'
import { Button, FormField, Input } from '../components/ui'

export default function Onboarding() {
  const [form, setForm] = useState({
    tenant1stFloorName: DEFAULT_SETTINGS.tenant1stFloorName,
    tenant2ndFloorName: DEFAULT_SETTINGS.tenant2ndFloorName,
    defaultRent1st: DEFAULT_SETTINGS.defaultRent1st,
    defaultRent2nd: DEFAULT_SETTINGS.defaultRent2nd,
    ssgcGround: 1,
    ssgcFirst: 1,
    ssgcSecond: 1,
    motorGround: 1,
    motorFirst: 1,
    motorSecond: 1,
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
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
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[640px] bg-bg-card border border-neutral-300 rounded-lg shadow-md p-8">
        <h1 className="font-display text-title-xl text-primary-900">Welcome to Khata</h1>
        <p className="text-body-md text-neutral-500 mt-2">
          Your building's ledger, on the web. Let's set up a few defaults — you can change these
          anytime in Settings.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="1st Floor Tenant Name">
              <Input
                value={form.tenant1stFloorName}
                onChange={(e) => update('tenant1stFloorName', e.target.value)}
                required
              />
            </FormField>
            <FormField label="2nd Floor Tenant Name">
              <Input
                value={form.tenant2ndFloorName}
                onChange={(e) => update('tenant2ndFloorName', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Default Rent — 1st Floor (PKR)">
              <Input
                type="number"
                min="0"
                value={form.defaultRent1st}
                onChange={(e) => update('defaultRent1st', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Default Rent — 2nd Floor (PKR)">
              <Input
                type="number"
                min="0"
                value={form.defaultRent2nd}
                onChange={(e) => update('defaultRent2nd', e.target.value)}
                required
              />
            </FormField>
          </div>

          <div>
            <h3 className="font-display text-title-md text-primary-900 mb-1">SSGC Split Ratio</h3>
            <p className="text-body-sm text-neutral-500 mb-3">
              How the total SSGC bill is divided across floors (default: equal 3-way split).
            </p>
            <div className="grid grid-cols-3 gap-4">
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
          </div>

          <div>
            <h3 className="font-display text-title-md text-primary-900 mb-1">Motor Split Ratio</h3>
            <p className="text-body-sm text-neutral-500 mb-3">
              How the total motor (water pump) bill is divided across floors.
            </p>
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
          </div>

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
