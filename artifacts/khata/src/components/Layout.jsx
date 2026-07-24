import { Link, useLocation } from 'wouter'
import { LayoutDashboard, PlusCircle, History, BarChart3, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/new-month', label: 'New Month', icon: PlusCircle },
  { to: '/history', label: 'History', icon: History },
  { to: '/annual', label: 'Annual', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NavItem({ to, label, icon: Icon, linkClassName }) {
  const [location] = useLocation()
  const isActive = location === to || (to !== '/dashboard' && location.startsWith(to))

  return (
    <Link
      to={to}
      className={`${linkClassName} ${
        isActive
          ? 'bg-primary-700 text-white'
          : 'text-primary-100 hover:bg-primary-700/60 hover:text-white'
      }`}
    >
      <Icon size={18} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  )
}

function NavItems({ className, linkClassName }) {
  return (
    <nav className={className}>
      {NAV_ITEMS.map(({ to, label, icon }) => (
        <NavItem
          key={to}
          to={to}
          label={label}
          icon={icon}
          linkClassName={linkClassName}
        />
      ))}
    </nav>
  )
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg-base">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 bg-primary-900 px-4 py-6">
        <div className="font-display text-title-lg text-white mb-8 px-2">Khata</div>
        <NavItems
          className="flex flex-col gap-1"
          linkClassName="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-md font-medium transition-colors duration-fast"
        />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden bg-primary-900 px-4 py-4 flex items-center justify-between">
        <div className="font-display text-title-lg text-white">Khata</div>
      </header>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8 max-w-[1100px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary-900 flex justify-around py-2 z-10">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            return (
              <NavItem
                key={to}
                to={to}
                label={label}
                icon={Icon}
                linkClassName="flex flex-col items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium min-w-[44px] min-h-[44px] justify-center"
              />
            )
          })}
        </nav>
      </div>
    </div>
  )
}
