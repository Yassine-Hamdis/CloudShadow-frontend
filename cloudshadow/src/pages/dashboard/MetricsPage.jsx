import { useEffect, useState, useCallback } from 'react'
import { subHours, subDays, formatDistanceToNow } from 'date-fns'
import { Play, Pause, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import MetricChart     from '../../components/dashboard/MetricChart'
import LoadingSpinner  from '../../components/common/LoadingSpinner'
import useMetricsStore from '../../store/metricsStore'
import { getServers }  from '../../api/servers'
import { getMetricsByServer, getMetricsByRange, getLatestMetric } from '../../api/metrics'

const RANGES = [
  { label: '1h',  hours: 1  },
  { label: '6h',  hours: 6  },
  { label: '24h', hours: 24 },
  { label: '7d',  hours: 168 },
]

export default function MetricsPage() {
  const { metricsByServer, latestByServer, setMetrics, setLatest } = useMetricsStore()

  const [servers, setServers]       = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [range, setRange]           = useState(RANGES[0])
  const [live, setLive]             = useState(true)
  const [loading, setLoading]       = useState(false)
  const [loadingServers, setLoadingServers] = useState(true)

  // ── Load server list ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingServers(true)
      try {
        const srvs = await getServers()
        setServers(srvs)
        if (srvs.length > 0) setSelectedId(srvs[0].id)
      } catch {
        toast.error('Failed to load servers')
      } finally {
        setLoadingServers(false)
      }
    }
    load()
  }, [])

  // ── Fetch metrics for selected server + range ───────────────────────────
  const fetchMetrics = useCallback(async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      let data
      if (range.hours <= 24) {
        const from = subHours(new Date(), range.hours).toISOString()
        const to   = new Date().toISOString()
        data = await getMetricsByRange(from, to)
        // filter for selected server
        data = data.filter((m) => m.serverId === selectedId)
      } else {
        const from = subDays(new Date(), range.hours / 24).toISOString()
        const to   = new Date().toISOString()
        data = await getMetricsByRange(from, to)
        data = data.filter((m) => m.serverId === selectedId)
      }
      setMetrics(selectedId, data)

      // also fetch latest
      try {
        const latest = await getLatestMetric(selectedId)
        setLatest(selectedId, latest)
      } catch { /* no metrics yet */ }
    } catch {
      toast.error('Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [selectedId, range])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const metrics = selectedId ? (metricsByServer[selectedId] || []) : []
  const latest  = selectedId ? latestByServer[selectedId] : null

  // Network chart needs different domain
  const hasNetwork = metrics.some((m) => m.networkIn || m.networkOut)

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="app-panel-soft rounded-[1.75rem] p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#9AA6B2] mb-2">Performance</div>
          <h1 className="page-title">Metrics</h1>
          <p className="page-subtitle">
            Historical and real-time performance data
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Server selector */}
          {loadingServers ? (
            <LoadingSpinner size="sm" />
          ) : (
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="
                bg-[#1f2937] border border-[#374151] rounded-xl
                text-sm text-[#E6EEF2] px-3 py-2.5
                focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/45
              "
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {/* Time range */}
          <div className="flex items-center bg-[#1f2937] border border-[#374151] rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${range.label === r.label
                    ? 'bg-[#3f51b5] text-white'
                    : 'text-[#9AA6B2] hover:text-[#E6EEF2]'
                  }
                `}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Live/Pause toggle */}
          <button
            onClick={() => setLive(!live)}
            className={`
              flex items-center gap-2 app-button-sm text-xs font-medium
              border transition-all
              ${live
                ? 'border-[#4CAF50] text-[#4CAF50] bg-[#4CAF50]/10'
                : 'border-[#374151] text-[#9AA6B2] hover:border-[#4b5563]'
              }
            `}
          >
            {live
              ? <><span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />Live</>
              : <><Pause className="w-3 h-3" />Paused</>
            }
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="
              app-button-sm p-2 border border-[#374151]
              text-[#9AA6B2] hover:text-[#E6EEF2]
              hover:border-[#4b5563] transition-all
            "
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Latest metric summary bar */}
      {latest && (
        <div className="
          bg-[#1f2937] border border-[#374151] rounded-2xl
          px-5 py-4 flex items-center gap-6 flex-wrap app-panel-soft
        ">
          <span className="text-xs font-semibold text-[#9AA6B2] uppercase tracking-wider">
            Latest
          </span>
          {[
            { label: 'CPU',    value: latest.cpu,    unit: '%' },
            { label: 'Memory', value: latest.memory, unit: '%' },
            { label: 'Disk',   value: latest.disk,   unit: '%' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-[#9AA6B2]">{label}:</span>
              <span className={`text-sm font-bold ${
                value >= 90 ? 'text-[#E53935]' :
                value >= 75 ? 'text-[#FFC107]' :
                'text-[#4CAF50]'
              }`}>
                {value.toFixed(1)}{unit}
              </span>
            </div>
          ))}
          {latest.networkIn && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9AA6B2]">Net In:</span>
                <span className="text-sm font-bold text-[#E6EEF2]">
                  {latest.networkIn.toFixed(0)} KB/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9AA6B2]">Net Out:</span>
                <span className="text-sm font-bold text-[#E6EEF2]">
                  {latest.networkOut?.toFixed(0) ?? 0} KB/s
                </span>
              </div>
            </>
          )}
          <span className="text-xs text-[#9AA6B2] ml-auto">
            Updated {formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Charts grid */}
      {loading && metrics.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MetricChart
            title="CPU Usage"
            data={metrics}
            lines={[{ key: 'cpu', name: 'CPU %', color: '#3f51b5' }]}
            loading={loading}
          />
          <MetricChart
            title="Memory Usage"
            data={metrics}
            lines={[{ key: 'memory', name: 'Memory %', color: '#FFC107' }]}
            loading={loading}
          />
          <MetricChart
            title="Disk Usage"
            data={metrics}
            lines={[{ key: 'disk', name: 'Disk %', color: '#4CAF50' }]}
            loading={loading}
          />
          <MetricChart
            title="Network I/O (KB/s)"
            data={metrics}
            lines={[
              { key: 'networkIn',  name: 'In',  color: '#3f51b5', unit: ' KB/s' },
              { key: 'networkOut', name: 'Out', color: '#E53935', unit: ' KB/s' },
            ]}
            yUnit=" KB/s"
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}