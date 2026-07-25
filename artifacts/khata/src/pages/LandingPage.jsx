import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-4">
      <div className="bg-white rounded-xl shadow-md p-10 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/logo.svg" alt="Khata" className="h-14 w-14" />
        </div>

        {/* Wordmark */}
        <h1 className="font-display text-title-xl text-primary-900 mb-1">Khata</h1>
        <p className="text-body-md text-neutral-500 mb-8">
          Your Building's Ledger, On the Web
        </p>

        <p className="text-body-md text-neutral-700 mb-6">
          Sign in to access your ledger
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            aria-label="Log in to Khata"
            className="w-full bg-primary-900 text-white rounded-md h-11 font-medium text-body-md hover:bg-primary-700 transition-colors duration-fast"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => navigate('/sign-up')}
            className="w-full border border-neutral-300 text-primary-900 rounded-md h-11 font-medium text-body-md hover:bg-neutral-100 transition-colors duration-fast"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
