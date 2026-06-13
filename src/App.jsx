import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewMonth from './pages/NewMonth'
import HistoryPage from './pages/History'
import MonthlySummary from './pages/MonthlySummary'
import Annual from './pages/Annual'
import SettingsPage from './pages/Settings'
import Onboarding from './pages/Onboarding'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const settings = useSettings()

  if (settings === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <p className="text-neutral-500 font-body">Loading Khata…</p>
      </div>
    )
  }

  if (!settings.onboarded) {
    return (
      <HashRouter>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-month" element={<NewMonth />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<MonthlySummary />} />
          <Route path="/annual" element={<Annual />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
