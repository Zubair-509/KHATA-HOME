import { useState, useEffect } from 'react'
import { getSettings } from '../lib/api'

/**
 * Fetches user settings from the API.
 * Returns `undefined` while loading (matches the previous Dexie useLiveQuery behaviour
 * so ProtectedLayout's loading check stays unchanged).
 */
export function useSettings() {
  const [settings, setSettings] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((s) => { if (!cancelled) setSettings(s) })
      .catch(() => { if (!cancelled) setSettings(null) })
    return () => { cancelled = true }
  }, [])

  return settings
}
