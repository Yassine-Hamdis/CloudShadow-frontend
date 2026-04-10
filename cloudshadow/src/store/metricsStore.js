import { create } from 'zustand'

const SLIDING_WINDOW = 30

const useMetricsStore = create((set, get) => ({
  // Map<serverId, MetricResponse[]>
  metricsByServer: {},
  // Map<serverId, MetricResponse>
  latestByServer:  {},

  // ── Replace metrics for a specific server ──────────────────────────────
  setMetrics: (serverId, metrics) => {
    set((state) => ({
      metricsByServer: {
        ...state.metricsByServer,
        [serverId]: metrics.slice(-SLIDING_WINDOW),
      },
    }))
  },

  // ── Set the latest metric for a server ─────────────────────────────────
  setLatest: (serverId, metric) => {
    set((state) => ({
      latestByServer: {
        ...state.latestByServer,
        [serverId]: metric,
      },
    }))
  },

  // ── Append a new metric (sliding window) ───────────────────────────────
  appendMetric: (metric) => {
    const { serverId } = metric
    set((state) => {
      const existing = state.metricsByServer[serverId] || []
      const updated  = [...existing, metric]

      // Enforce sliding window
      if (updated.length > SLIDING_WINDOW) {
        updated.shift()
      }

      return {
        metricsByServer: {
          ...state.metricsByServer,
          [serverId]: updated,
        },
        latestByServer: {
          ...state.latestByServer,
          [serverId]: metric,
        },
      }
    })
  },

  // ── Clear all metrics (on logout) ─────────────────────────────────────
  clearMetrics: () => {
    set({ metricsByServer: {}, latestByServer: {} })
  },
}))

export default useMetricsStore