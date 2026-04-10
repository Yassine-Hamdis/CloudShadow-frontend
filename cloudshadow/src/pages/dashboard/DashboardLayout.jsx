import { Outlet }      from 'react-router-dom'
import { useEffect }   from 'react'
import Sidebar         from '../../components/common/Sidebar'
import Header          from '../../components/common/Header'
import useAlertsStore  from '../../store/alertsStore'
import { getCriticalCount, getAlerts } from '../../api/alerts'

export default function DashboardLayout() {
  const { setAlerts, setCriticalCount } = useAlertsStore()

  // Bootstrap alerts data on layout mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [alerts, count] = await Promise.all([
          getAlerts(),
          getCriticalCount(),
        ])
        setAlerts(alerts)
        setCriticalCount(count)
      } catch {
        // Silently fail — non-critical
      }
    }
    bootstrap()
  }, [])

  return (
    <div className="min-h-screen flex">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(63,81,181,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(76,175,80,0.06),transparent_28%)]" />
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <Header />

        {/* Main content area */}
        <main className="min-h-screen">
          <div className="px-5 pb-8 pt-5 space-y-6 max-w-[1360px]">
          <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}