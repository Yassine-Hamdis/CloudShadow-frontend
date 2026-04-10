import { NavLink }   from 'react-router-dom'
import useAuthStore  from '../../store/authStore'
import {
  LayoutDashboard,
  Server,
  BarChart2,
  Bell,
  Users,
  Activity,
} from 'lucide-react'

const NAV_ITEMS = [
  {
    label: 'Overview',
    to:    '/dashboard',
    icon:  LayoutDashboard,
    roles: ['ADMIN', 'USER'],
    end:   true,
  },
  {
    label: 'Servers',
    to:    '/dashboard/servers',
    icon:  Server,
    roles: ['ADMIN'],
  },
  {
    label: 'Metrics',
    to:    '/dashboard/metrics',
    icon:  BarChart2,
    roles: ['ADMIN', 'USER'],
  },
  {
    label: 'Alerts',
    to:    '/dashboard/alerts',
    icon:  Bell,
    roles: ['ADMIN', 'USER'],
  },
  {
    label: 'Users',
    to:    '/dashboard/users',
    icon:  Users,
    roles: ['ADMIN'],
  },
]

export default function Sidebar() {
  const { role } = useAuthStore()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="
      sticky top-0 h-screen w-48 shrink-0
      app-panel-soft flex flex-col z-40 shadow-[10px_0_30px_rgba(0,0,0,0.18)]
    ">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#374151]/70">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#3f51b5] to-[#5c6bc0] shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-[#E6EEF2] tracking-tight block">
            CloudShadow
          </span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#9AA6B2]">Monitoring</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-gradient-to-r from-[#3f51b5] to-[#5c6bc0] text-white shadow-lg shadow-[#3f51b5]/20'
                : 'text-[#9AA6B2] hover:bg-white/5 hover:text-[#E6EEF2]'
              }
            `}
          >
            <item.icon className="w-4 h-4 flex-shrink-0 opacity-90" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#374151]/70">
        <p className="text-xs text-[#6b7280] font-mono">v1.0.0</p>
      </div>
    </aside>
  )
}