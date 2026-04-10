import { useNavigate }  from 'react-router-dom'
import useAuthStore     from '../../store/authStore'
import useAlertsStore   from '../../store/alertsStore'
import { LogOut, Bell } from 'lucide-react'

export default function Header() {
  const navigate  = useNavigate()
  const { email, companyName, logout } = useAuthStore()
  const { criticalCount }              = useAlertsStore()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Initials avatar
  const initials = email ? email[0].toUpperCase() : '?'

  return (
    <header className="
      sticky top-0 h-16 w-full
      app-panel-soft border-x-0 border-t-0
      flex items-center justify-between px-6
      z-30 shadow-[0_10px_30px_rgba(0,0,0,0.18)]
    ">
      {/* Left: Company name */}
      <div>
        <h2 className="text-sm font-semibold text-[#E6EEF2] tracking-wide">{companyName}</h2>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#9AA6B2] mt-1">Server Monitoring Dashboard</p>
      </div>

      {/* Right: alerts badge + user + logout */}
      <div className="flex items-center gap-2.5">

        {/* Critical alerts badge */}
        <div className="relative">
          <Bell className="w-4 h-4 text-[#9AA6B2]" />
          {criticalCount > 0 && (
            <span className="
              absolute -top-2 -right-2
              bg-[#E53935] text-white text-xs font-bold
              rounded-full min-w-4 h-4 px-1 flex items-center justify-center
              leading-none
            ">
              {criticalCount > 99 ? '99+' : criticalCount}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[#374151]/80" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="
            w-7 h-7 rounded-full bg-gradient-to-br from-[#3f51b5] to-[#5c6bc0]
            flex items-center justify-center
            text-sm font-semibold text-white
          ">
            {initials}
          </div>
          <span className="text-sm text-[#9AA6B2] max-w-[180px] truncate leading-tight">
            {email}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            app-button-sm flex items-center gap-1.5
            text-sm text-[#9AA6B2] hover:text-[#E53935]
            hover:bg-[#E53935]/10 transition-all
          "
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}