import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { getReceipt, saveReceipt, deleteReceipt } from '../lib/db'
import { Input, Select } from './ui'

/**
 * A single bill/payment entry: Amount (PKR), Status (Paid/Pending), Date, Receipt photo.
 * Per FR-2.6 and FR-2.7.
 *
 * Props:
 *   label      – field label shown to the user
 *   value      – { amount, status, date, receiptImageRef }
 *   onChange   – (newValue) => void
 *   recordId   – (optional) parent month record id, required for receipt storage
 *   fieldRef   – (optional) stable key for this entry, e.g. "groundFloor.ke"
 */
export default function EntryField({ label, value, onChange, recordId, fieldRef }) {
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [viewing, setViewing] = useState(false)

  // Load existing receipt from IndexedDB when recordId/fieldRef are known
  useEffect(() => {
    if (!recordId || !fieldRef) return
    let objectUrl = null
    getReceipt(recordId, fieldRef).then((rec) => {
      if (rec?.imageBlob) {
        objectUrl = URL.createObjectURL(rec.imageBlob)
        setPreviewUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [recordId, fieldRef])

  function set(patch) {
    onChange({ ...value, ...patch })
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !recordId || !fieldRef) return
    await saveReceipt(recordId, fieldRef, file)
    // Revoke previous URL before creating a new one
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    onChange({ ...value, receiptImageRef: fieldRef })
    // Reset file input so the same file can be re-selected after deletion
    e.target.value = ''
  }

  async function handleDelete() {
    if (!recordId || !fieldRef) return
    await deleteReceipt(recordId, fieldRef)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    onChange({ ...value, receiptImageRef: null })
  }

  const showReceiptColumn = Boolean(recordId && fieldRef)

  return (
    <div className="py-2 border-b border-neutral-100 last:border-b-0">
      <div
        className={`grid gap-3 items-end ${
          showReceiptColumn
            ? 'grid-cols-1 sm:grid-cols-[1fr_120px_140px_52px]'
            : 'grid-cols-1 sm:grid-cols-[1fr_120px_140px]'
        }`}
      >
        {/* Amount */}
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

        {/* Status */}
        <label className="flex flex-col gap-1.5">
          <span className="text-body-sm text-neutral-500">Status</span>
          <Select value={value.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </Select>
        </label>

        {/* Date */}
        <label className="flex flex-col gap-1.5">
          <span className="text-body-sm text-neutral-500">Date</span>
          <Input
            type="date"
            value={value.date || ''}
            onChange={(e) => set({ date: e.target.value || null })}
          />
        </label>

        {/* Receipt photo — only shown when recordId + fieldRef are provided */}
        {showReceiptColumn && (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-sm text-neutral-500">Receipt</span>
            {previewUrl ? (
              <div className="relative w-11 h-11">
                <button
                  type="button"
                  onClick={() => setViewing(true)}
                  className="w-11 h-11 rounded-md overflow-hidden border border-neutral-300 hover:border-primary-500 transition-colors block"
                  title="View receipt"
                >
                  <img src={previewUrl} alt="Receipt" className="w-full h-full object-cover" />
                </button>
                {/* Delete badge */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-outflow-text hover:bg-outflow-bg transition-colors shadow-sm"
                  title="Remove receipt"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 rounded-md border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                title="Attach receipt photo"
              >
                <Camera size={18} strokeWidth={1.5} />
              </button>
            )}

            {/* Hidden file input — capture="environment" opens the camera on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {viewing && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setViewing(false)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewUrl}
              alt="Receipt"
              className="max-w-full max-h-[85vh] rounded-lg shadow-lg object-contain"
            />
            <button
              onClick={() => setViewing(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
