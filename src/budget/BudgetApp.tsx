import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useBudgetCategoryStore } from '../stores/budgetCategoryStore'
import { useBudgetSettingsStore } from '../stores/budgetSettingsStore'
import { useBudgetTransactionStore } from '../stores/budgetTransactionStore'
import { useThemeApplicator } from '../hooks/useThemeApplicator'
import { ToastContainer } from '../components/ui/Toast'
import { AuthModal } from '../components/auth/AuthModal'
import { BudgetHeader } from './components/BudgetHeader'
import { WeeklyOverviewPanel } from './components/WeeklyOverviewPanel'
import { SpendingTable } from './components/SpendingTable'
import { AddTransactionModal } from './components/AddTransactionModal'
import { BudgetCommandPalette } from './components/BudgetCommandPalette'
import { SpendingGraphs } from './components/SpendingGraphs'
import { BudgetLeaderboard } from './components/BudgetLeaderboard'
import { format, startOfWeek } from 'date-fns'
import '../styles/themes.css'
import '../styles/globals.css'

function getMondayStr(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function BudgetApp() {
  useThemeApplicator()

  const { user, hydrateFromToken } = useAuthStore()
  const { syncFromServer: syncCategories } = useBudgetCategoryStore()
  const { syncFromServer: syncSettings } = useBudgetSettingsStore()
  const { fetchWeek, currentWeekStart } = useBudgetTransactionStore()

  const [showGraphs, setShowGraphs] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    hydrateFromToken().then((ok) => {
      if (ok) {
        syncCategories()
        syncSettings()
        fetchWeek(getMondayStr())
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When user logs in after auth modal
  useEffect(() => {
    if (user) {
      syncCategories()
      syncSettings()
      fetchWeek(getMondayStr())
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekLabel = (() => {
    const monday = new Date(currentWeekStart + 'T00:00:00Z')
    const sunday = new Date(currentWeekStart + 'T00:00:00Z')
    sunday.setUTCDate(sunday.getUTCDate() + 6)
    return `Week of ${format(monday, 'EEE d MMM')}`
  })()

  if (!user) {
    return (
      <div style={{ height: '100dvh', background: 'var(--color-bg)' }}>
        <AuthModal />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <BudgetHeader
        onOpenGraphs={() => setShowGraphs(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      <main className="flex-1 flex p-3 gap-2 min-h-0 overflow-hidden">
        {/* Left 1/4 — weekly overview */}
        <div style={{ width: '25%', minWidth: 200, flexShrink: 0, overflow: 'hidden' }}>
          <WeeklyOverviewPanel weekLabel={weekLabel} />
        </div>

        {/* Right 3/4 — spending table */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <SpendingTable />
        </div>
      </main>

      <AddTransactionModal />
      <BudgetCommandPalette
        onOpenSettings={() => {/* settings opened via BudgetHeader */}}
        onOpenGraphs={() => setShowGraphs(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
      <SpendingGraphs open={showGraphs} onClose={() => setShowGraphs(false)} />
      <BudgetLeaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ToastContainer />
    </div>
  )
}
