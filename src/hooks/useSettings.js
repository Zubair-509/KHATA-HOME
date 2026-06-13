import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from '../lib/db'

export function useSettings() {
  return useLiveQuery(() => getSettings(), [], undefined)
}
