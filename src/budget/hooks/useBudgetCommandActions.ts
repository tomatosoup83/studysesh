import { useMemo } from 'react'
import { Plus, BarChart2, Settings, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CommandDefinition } from '../../lib/commands'
import { COMMAND_CATEGORIES } from '../../lib/commands'
import { useBudgetCommandStore } from '../../stores/budgetCommandStore'
import { useBudgetTransactionStore } from '../../stores/budgetTransactionStore'
import { useShortcutsStore, formatCombo } from '../../stores/shortcutsStore'

export function useBudgetCommandActions(
  onAddTransaction?: () => void,
  onOpenSettings?: () => void,
  onOpenGraphs?: () => void,
  onOpenLeaderboard?: () => void,
): CommandDefinition[] {
  const cmd = useBudgetCommandStore()
  const { navigateWeek } = useBudgetTransactionStore()
  const { bindings } = useShortcutsStore()

  return useMemo<CommandDefinition[]>(() => [
    {
      id: 'budget-add-transaction',
      label: 'Add Transaction',
      category: COMMAND_CATEGORIES.TASKS,
      icon: Plus,
      shortcut: formatCombo(bindings['budget-transaction-add']),
      keywords: ['add', 'new', 'expense', 'spending'],
      action: () => { onAddTransaction?.(); cmd.closePalette() },
    },
    {
      id: 'budget-prev-week',
      label: 'Previous Week',
      category: COMMAND_CATEGORIES.TASKS,
      icon: ChevronLeft,
      action: () => { navigateWeek('prev'); cmd.closePalette() },
    },
    {
      id: 'budget-next-week',
      label: 'Next Week',
      category: COMMAND_CATEGORIES.TASKS,
      icon: ChevronRight,
      action: () => { navigateWeek('next'); cmd.closePalette() },
    },
    {
      id: 'budget-view-graphs',
      label: 'View Spending Graphs',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: BarChart2,
      keywords: ['chart', 'graph', 'analytics', 'trends'],
      action: () => { onOpenGraphs?.(); cmd.closePalette() },
    },
    {
      id: 'budget-leaderboard',
      label: 'View Leaderboard',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: BarChart2,
      keywords: ['rank', 'community', 'compare'],
      action: () => { onOpenLeaderboard?.(); cmd.closePalette() },
    },
    {
      id: 'budget-settings',
      label: 'Budget Settings',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: Settings,
      keywords: ['categories', 'limit', 'calendar', 'terms'],
      action: () => { onOpenSettings?.(); cmd.closePalette() },
    },
    {
      id: 'budget-go-studysesh',
      label: 'Open StudySesh',
      category: COMMAND_CATEGORIES.SETTINGS,
      icon: BookOpen,
      keywords: ['study', 'timer', 'pomodoro', 'tasks'],
      action: () => { window.location.href = '/study' },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [bindings])
}
