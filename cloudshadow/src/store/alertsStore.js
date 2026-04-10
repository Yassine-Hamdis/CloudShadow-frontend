import { create } from 'zustand'

const useAlertsStore = create((set) => ({
  alerts:        [],
  criticalCount: 0,

  // ── Replace all alerts ─────────────────────────────────────────────────
  setAlerts: (alerts) => {
    set({ alerts })
  },

  // ── Insert new alert at the top (real-time) ────────────────────────────
  prependAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
    }))
  },

  // ── Set critical count from API ────────────────────────────────────────
  setCriticalCount: (count) => {
    set({ criticalCount: count })
  },

  // ── Increment critical count (on real-time CRITICAL alert) ─────────────
  incrementCriticalCount: () => {
    set((state) => ({
      criticalCount: state.criticalCount + 1,
    }))
  },

  // ── Clear on logout ────────────────────────────────────────────────────
  clearAlerts: () => {
    set({ alerts: [], criticalCount: 0 })
  },
}))

export default useAlertsStore