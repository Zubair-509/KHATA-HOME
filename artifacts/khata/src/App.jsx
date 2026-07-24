import { useEffect, useRef } from 'react'
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from '@clerk/react'
import { publishableKeyFromHost } from '@clerk/react/internal'
import { shadcn } from '@clerk/themes'
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewMonth from './pages/NewMonth'
import HistoryPage from './pages/History'
import MonthlySummary from './pages/MonthlySummary'
import Annual from './pages/Annual'
import SettingsPage from './pages/Settings'
import Onboarding from './pages/Onboarding'
import NotFound from './pages/not-found'
import { useSettings } from './hooks/useSettings'

const queryClient = new QueryClient()

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
)

// Empty in dev (intentional), auto-set in prod. Do NOT gate on NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

function stripBase(path) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

const clerkAppearance = {
  theme: shadcn,
  // No cssLayerName — project uses Tailwind v3 / PostCSS
  options: {
    logoPlacement: 'inside',
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1B4332',
    colorForeground: '#1C1C1E',
    colorMutedForeground: '#6B7280',
    colorDanger: '#9B1C1C',
    colorBackground: '#FFFFFF',
    colorInput: '#F3F4F6',
    colorInputForeground: '#1C1C1E',
    colorNeutral: '#D1D5DB',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1C1C1E] font-semibold',
    headerSubtitle: 'text-[#6B7280]',
    socialButtonsBlockButtonText: 'text-[#374151] font-medium',
    formFieldLabel: 'text-[#374151] font-medium text-sm',
    footerActionLink: 'text-[#1B4332] font-medium',
    footerActionText: 'text-[#6B7280]',
    dividerText: 'text-[#6B7280]',
    identityPreviewEditButton: 'text-[#1B4332]',
    formFieldSuccessText: 'text-[#2D6A4F]',
    alertText: 'text-[#9B1C1C]',
    logoBox: 'mb-2',
    logoImage: 'h-10 w-auto',
    socialButtonsBlockButton: 'border border-[#D1D5DB] hover:bg-[#F3F4F6] transition-colors',
    formButtonPrimary: 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-medium transition-colors',
    formFieldInput: 'bg-[#F3F4F6] border-[#D1D5DB] text-[#1C1C1E]',
    footerAction: 'bg-[#F9FAFB]',
    dividerLine: 'bg-[#D1D5DB]',
    alert: 'bg-[#FEE2E2] border-[#EF4444]',
    otpCodeFieldInput: 'border-[#D1D5DB]',
    formFieldRow: '',
    main: '',
  },
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <p className="text-neutral-500 font-body">Checking your session…</p>
    </div>
  )
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  )
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  )
}

function LandingPage() {
  const [, setLocation] = useLocation()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-4">
      <div className="mb-8 text-center">
        <h1 className="font-display text-[2.5rem] font-bold text-primary-900 mb-2">Khata</h1>
        <p className="text-neutral-500 font-body text-sm">Your Building's Ledger, On the Web</p>
      </div>
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8 flex flex-col gap-4 items-center">
        <p className="text-neutral-700 font-body text-center">Sign in to access your ledger</p>
        <button
          onClick={() => setLocation('/sign-in')}
          className="w-full bg-primary-900 hover:bg-primary-700 text-white font-body font-medium py-3 px-6 rounded-md transition-colors text-base"
          aria-label="Log in to Khata"
        >
          Log In
        </button>
        <button
          onClick={() => setLocation('/sign-up')}
          className="w-full bg-white hover:bg-neutral-100 text-primary-900 font-body font-medium py-3 px-6 rounded-md border border-neutral-300 transition-colors text-base"
        >
          Create Account
        </button>
      </div>
    </div>
  )
}

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return <LoadingScreen />
  if (isSignedIn) return <Redirect to="/dashboard" />
  return <LandingPage />
}

function ProtectedRoute({ component: Component }) {
  const { isSignedIn, isLoaded } = useAuth()
  const settings = useSettings()

  if (!isLoaded || settings === undefined) return <LoadingScreen />
  if (!isSignedIn) return <Redirect to="/" />
  if (!settings.onboarded) return <Onboarding />

  return (
    <Layout>
      <Component />
    </Layout>
  )
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk()
  const qc = useQueryClient()
  const prevUserIdRef = useRef(undefined)

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear()
      }
      prevUserIdRef.current = userId
    })
    return unsubscribe
  }, [addListener, qc])

  return null
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation()

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to your Khata account',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Set up your building ledger',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/new-month" component={() => <ProtectedRoute component={NewMonth} />} />
            <Route path="/history" component={() => <ProtectedRoute component={HistoryPage} />} />
            <Route path="/history/:id" component={() => <ProtectedRoute component={MonthlySummary} />} />
            <Route path="/annual" component={() => <ProtectedRoute component={Annual} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  )
}
