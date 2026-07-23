import { Input, Select } from './ui'

/**
 * A single bill/payment entry: Amount (PKR), Status (Paid/Pending), Date.
 * Per FR-2.6.
 */
export default function EntryField({ label, value, onChange }) {
  function set(patch) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] gap-3 items-end py-2 border-b border-neutral-100 last:border-b-0">
      <label className="flex flex-col gap-1.5">
        <span className="text-body-md font-semibold text-neutral-700">{label}</span>
        <Input
          type="number"
          min="0"
          inputMode="decimal"
          value={value.amount}
          onChange={(e) => set({ amount: Number(e.target.value) || 0 })}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-body-sm text-neutral-500">Status</span>
        <Select value={value.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </Select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-body-sm text-neutral-500">Date</span>
        <Input type="date" value={value.date || ''} onChange={(e) => set({ date: e.target.value || null })} />
      </label>
    </div>
  )
}
