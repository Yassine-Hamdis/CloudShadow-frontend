import { useEffect, useState, useMemo } from 'react'
import { Link }                          from 'react-router-dom'
import { Cpu, HardDrive, MemoryStick, AlertTriangle, ArrowRight } from 'lucide-react'
import StatCard        from '../../components/dashboard/StatCard'
import MetricChart     from '../../components/dashboard/MetricChart'
import AlertCard       from '../../components/dashboard/AlertCard'
import ServerStatusBadge from '../../components/dashboard/ServerStatusBadge'
import useMetricsStore from '../../store/metricsStore'
import useAlertsStore  from '../../store/alertsStore'
import { getServers }           from '../../api/servers'
import { getLatestMetric, getMetricsByServer } from '../../api/metrics'

const getMetricStatus = (value) => {
  if (value >= 90) return 'danger'
  if (value >= 75) return 'warning'
  return 'normal'
}

export default function OverviewPage() {
  const { metricsByServer, latestByServer, setMetrics, setLatest } = useMetricsStore()
  const { alerts, criticalCount } = useAlertsStore()

  const [servers, setServers]         = useState([])
  const [selectedId, setSelectedId]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(false)

  // ── Load servers + their latest metrics ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const srvs = await getServers()
        setServers(srvs)

        // Fetch latest metric for each server in parallel
        await Promise.allSettled(
          srvs.map(async (s) => {
            try {
              const latest = await getLatestMetric(s.id)
              setLatest(s.id, latest)
            } catch { /* server may have no metrics */ }
          })
        )

        // Auto-select worst performing server (highest CPU)
        if (srvs.length > 0) {
          const worst = srvs.reduce((prev, curr) => {
            const prevCpu = latestByServer[prev.id]?.cpu ?? 0
            const currCpu = latestByServer[curr.id]?.cpu ?? 0
            return currCpu > prevCpu ? curr : prev
          })
          setSelectedId(worst.id)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── When selectedId changes, load chart data ──────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    if (metricsByServer[selectedId]?.length > 0) return  // already loaded

    const loadChartData = async () => {
      setLoadingCharts(true)
      try {
        const metrics = await getMetricsByServer(selectedId)
        setMetrics(selectedId, metrics)
      } catch { /* empty */ }
      finally { setLoadingCharts(false) }
    }
    loadChartData()
  }, [selectedId])

  // ── Compute averages across all servers ─────────────────────────────────
  const averages = useMemo(() => {
    const vals = Object.values(latestByServer)
    if (!vals.length) return { cpu: null, memory: null, disk: null }
    return {
      cpu:    vals.reduce((a, m) => a + m.cpu,    0) / vals.length,
      memory: vals.reduce((a, m) => a + m.memory, 0) / vals.length,
      disk:   vals.reduce((a, m) => a + m.disk,   0) / vals.length,
    }
  }, [latestByServer])

  // ── Worst server (highest CPU) ───────────────────────────────────────────
  const worstServer = useMemo(() => {
    if (!servers.length) return null
    return servers.reduce((prev, curr) => {
      const p = latestByServer[prev.id]?.cpu ?? 0
      const c = latestByServer[curr.id]?.cpu ?? 0
      return c > p ? curr : prev
    })
  }, [servers, latestByServer])

  const selectedLatest  = selectedId ? latestByServer[selectedId]  : null
  const selectedMetrics = selectedId ? (metricsByServer[selectedId] || []) : []
  const recentAlerts    = alerts.slice(0, 5)

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="app-panel-soft rounded-[1.75rem] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#9AA6B2] mb-2">Dashboard</div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle max-w-2xl">
              Real-time view of your infrastructure, live metrics, and recent alerts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[220px] max-w-[260px] w-full sm:w-auto">
            <div className="rounded-2xl bg-white/4 border border-white/6 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9AA6B2]">Servers</p>
              <p className="text-xl font-semibold text-[#E6EEF2] mt-1">{servers.length}</p>
            </div>
            <div className="rounded-2xl bg-white/4 border border-white/6 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9AA6B2]">Critical</p>
              <p className="text-xl font-semibold text-[#E6EEF2] mt-1">{criticalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Avg CPU Usage"
          value={averages.cpu !== null ? averages.cpu.toFixed(1) : null}
          unit="%"
          icon={<Cpu className="w-5 h-5" />}
          status={averages.cpu !== null ? getMetricStatus(averages.cpu) : 'normal'}
          subtitle={`Across ${servers.length} servers`}
          loading={loading}
        />
        <StatCard
          title="Avg Memory Usage"
          value={averages.memory !== null ? averages.memory.toFixed(1) : null}
          unit="%"
          icon={<MemoryStick className="w-5 h-5" />}
          status={averages.memory !== null ? getMetricStatus(averages.memory) : 'normal'}
          subtitle={`Across ${servers.length} servers`}
          loading={loading}
        />
        <StatCard
          title="Avg Disk Usage"
          value={averages.disk !== null ? averages.disk.toFixed(1) : null}
          unit="%"
          icon={<HardDrive className="w-5 h-5" />}
          status={averages.disk !== null ? getMetricStatus(averages.disk) : 'normal'}
          subtitle={`Across ${servers.length} servers`}
          loading={loading}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalCount}
          unit=""
          icon={<AlertTriangle className="w-5 h-5" />}
          status={criticalCount > 0 ? 'danger' : 'normal'}
          subtitle="Requiring attention"
          loading={loading}
        />
      </div>

      {/* ── Middle row: Worst server card + Server selector ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Worst server highlight */}
        {worstServer && (
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-5 app-panel-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#9AA6B2] uppercase tracking-wider">
                Highest Load Server
              </p>
              <Link
                to="/dashboard/metrics"
                className="text-xs text-[#3f51b5] hover:text-[#5c6bc0] flex items-center gap-1"
              >
                View metrics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <h3 className="text-lg font-semibold text-[#E6EEF2] mb-1 font-mono">
              {worstServer.name}
            </h3>
            <ServerStatusBadge
              serverId={worstServer.id}
              lastSeen={worstServer.lastSeen}
            />
            {latestByServer[worstServer.id] && (
              <div className="mt-4 space-y-2">
                {[
                  { label: 'CPU',    value: latestByServer[worstServer.id].cpu,    color: '#3f51b5' },
                  { label: 'Memory', value: latestByServer[worstServer.id].memory, color: '#FFC107' },
                  { label: 'Disk',   value: latestByServer[worstServer.id].disk,   color: '#4CAF50' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9AA6B2]">{label}</span>
                      <span className="text-[#E6EEF2] font-medium">{value.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#374151] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Server selector */}
        <div className="lg:col-span-2 bg-[#1f2937] border border-[#374151] rounded-2xl p-5 app-panel-soft min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#E6EEF2]">
              Server Performance
            </p>
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="
                bg-[#0f1724] border border-[#374151] rounded-lg
                text-sm text-[#E6EEF2] px-3 py-1.5 max-w-[180px] truncate
                focus:outline-none focus:ring-2 focus:ring-[#3f51b5]
              "
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mini metric summary */}
          {selectedLatest && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'CPU',    value: selectedLatest.cpu    },
                { label: 'Memory', value: selectedLatest.memory },
                { label: 'Disk',   value: selectedLatest.disk   },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0f1724] rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-[#9AA6B2]">{label}</p>
                  <p className={`text-lg font-bold ${
                    value >= 90 ? 'text-[#E53935]' :
                    value >= 75 ? 'text-[#FFC107]' :
                    'text-[#4CAF50]'
                  }`}>
                    {value.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CPU chart */}
          <MetricChart
            title="CPU Usage"
            data={selectedMetrics}
            lines={[{ key: 'cpu', name: 'CPU', color: '#3f51b5', unit: '%' }]}
            loading={loadingCharts}
          />
        </div>
      </div>

      {/* ── Recent alerts ─────────────────────────────────────────────── */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-5 app-panel-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#E6EEF2]">Recent Alerts</h2>
          <Link
            to="/dashboard/alerts"
            className="text-xs text-[#3f51b5] hover:text-[#5c6bc0] flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#9AA6B2]">No alerts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}