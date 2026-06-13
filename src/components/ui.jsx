// Shared primitives per DDS Section 5

export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary-900 text-white hover:bg-primary-700',
    secondary: 'bg-neutral-100 text-primary-900 border border-neutral-300 hover:bg-neutral-50',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50',
    danger: 'bg-white text-outflow-text border border-outflow-text hover:bg-outflow-bg',
  }
  return (
    <button
      className={`h-11 px-5 rounded-md font-body text-[15px] font-semibold transition-colors duration-fast ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-bg-card border border-neutral-300 rounded-lg p-6 transition-shadow duration-normal hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sublabel, sublabelClassName = 'text-inflow-text', ariaLabel }) {
  return (
    <Card className="hover:shadow-sm">
      <div className="text-label uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="font-mono text-display text-primary-900 mt-2" aria-label={ariaLabel}>
        {value}
      </div>
      {sublabel && <div className={`text-body-sm mt-1 ${sublabelClassName}`}>{sublabel}</div>}
    </Card>
  )
}

const BADGE_STYLES = {
  paid: 'text-inflow-text bg-inflow-bg border-inflow-border',
  pending: 'text-pending-text bg-pending-bg border-pending-border',
  draft: 'text-neutral-700 bg-neutral-50 border-neutral-300',
}

export function Badge({ status, children }) {
  const style = BADGE_STYLES[status] || BADGE_STYLES.draft
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase border ${style}`}
    >
      {children || status}
    </span>
  )
}

export function FormField({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-body-md font-semibold text-neutral-700">{label}</span>
      {children}
      {hint && <span className="text-body-sm text-neutral-500">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`h-11 px-3 rounded-md border border-neutral-300 bg-white text-body-lg font-body focus:border-primary-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }) {
  return (
    <select
      className={`h-11 px-3 rounded-md border border-neutral-300 bg-white text-body-lg font-body focus:border-primary-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}
