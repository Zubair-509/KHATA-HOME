import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/react'
import { publishableKeyFromHost } from '@clerk/react/internal'
import { shadcn } from '@clerk/themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewMonth from './pages/NewMonth'
import HistoryPage from './pages/History'
import MonthlySummary from './pages/MonthlySummary'
import Annual from './pages/Annual'
import SettingsPage from './pages/Settings'
import Onboarding from './pages/Onboarding'
import LandingPage from './pages/LandingPage'
import { useSettings } from './hooks/useSettings'

const queryClient = new QueryClient()

// REQUIRED — resolves the publishable key from the request hostname so the same
// build works across dev and prod / custom domains. Do not inline the env var.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
)

// REQUIRED — empty in dev (intentional), auto-populated in prod. Do NOT gate
// this on NODE_ENV / import.meta.env.PROD — the empty dev value is correct.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

// Clerk passes full paths; strip basePath prefix before handing to react-router.
function stripBase(path) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path
}

// App uses Tailwind v3 / PostCSS — no cssLayerName, no layer reordering needed.
const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: 'inside',
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1B4332',
    colorForeground: '#1C1C1E',
    colorMutedForeground: '#6B7280',
    colorDanger: '#EF4444',
    colorBackground: '#FFFFFF',
    colorInput: '#F9FAFB',
    colorInputForeground: '#1C1C1E',
    colorNeutral: '#D1D5DB',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    // cardBox owns the single surface — card/footer are transparent
    cardBox: { background: '#FFFFFF', borderRadius: '16px', width: '440px', maxWidth: '100%', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
    card: { boxShadow: 'none', border: '0', background: 'transparent', borderRadius: '0' },
    footer: { boxShadow: 'none', border: '0', background: 'transparent', borderRadius: '0' },
    headerTitle: { color: '#1B4332', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '700' },
    headerSubtitle: { color: '#6B7280' },
    socialButtonsBlockButtonText: { color: '#374151' },
    formFieldLabel: { color: '#374151' },
    footerActionLink: { color: '#1B4332', fontWeight: '600' },
    footerActionText: { color: '#6B7280' },
    dividerText: { color: '#6B7280' },
    identityPreviewEditButton: { color: '#1B4332' },
    formFieldSuccessText: { color: '#2D6A4F' },
    alertText: { color: '#9B1C1C' },
    logoBox: { display: 'flex', justifyContent: 'center', marginBottom: '4px' },
    logoImage: { height: '48px', width: 'auto' },
    socialButtonsBlockButton: { border: '1px solid #D1D5DB', background: '#FFFFFF' },
    formButtonPrimary: { background: '#1B4332' },
    formFieldInput: { background: '#F9FAFB', border: '1px solid #D1D5DB' },
    footerAction: { background: 'transparent' },
    dividerLine: { background: '#D1D5DB' },
    alert: { background: '#FEE2E2', border: '1px solid #EF4444' },
    otpCodeFieldInput: { border: '1px solid #D1D5DB' },
    main: {},
    formFieldRow: {},
  },
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <p className="text-neutral-500 font-body">Loading Khata…</p>
    </div>
  )
}

// Home: redirects signed-in users to dashboard; shows landing for guests.
function HomeRoute() {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return <LoadingScreen />
  if (isSignedIn) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

// Wraps all authenticated app routes — checks auth, then onboarding.
function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const settings = useSettings()

  if (!isLoaded || settings === undefined) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  if (!settings.onboarded) return <Onboarding />

  return <Layout />
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      {/* path must be the full browser pathname — Clerk reads window.location.pathname directly */}
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  )
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  )
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: { title: 'Welcome back', subtitle: 'Sign in to your Khata account' },
        },
        signUp: {
          start: { title: 'Create your account', subtitle: 'Start tracking your building ledger' },
        },
      }}
      routerPush={(to) => navigate(stripBase(to))}
      routerReplace={(to) => navigate(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <Routes>
          {/* Public home — landing for guests, redirect to dashboard for auth users */}
          <Route path="/" element={<HomeRoute />} />

          {/* Clerk sign-in / sign-up — /*? equiv in react-router is /sign-in/* */}
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Protected app routes — auth + onboarding checked inside ProtectedLayout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-month" element={<NewMonth />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<MonthlySummary />} />
            <Route path="/annual" element={<Annual />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  )
}
