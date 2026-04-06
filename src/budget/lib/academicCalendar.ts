import { parseISO, startOfWeek, addDays, format, isWithinInterval } from 'date-fns'
import type { BudgetTermItem, BudgetHolidayItem } from '../../types/api'

export interface AcademicWeek {
  termName: string
  termIndex: number  // 1-based
  weekIndex: number  // 1-based
  label: string      // "Term 1, Week 3"
  mondayDate: string // 'YYYY-MM-DD'
  sundayDate: string // 'YYYY-MM-DD'
  holidays: BudgetHolidayItem[]
}

export function computeAcademicWeeks(
  terms: BudgetTermItem[],
  holidays: BudgetHolidayItem[]
): AcademicWeek[] {
  const weeks: AcademicWeek[] = []

  const sorted = [...terms].sort((a, b) => a.sortOrder - b.sortOrder)

  sorted.forEach((term, termIdx) => {
    const termStart = startOfWeek(parseISO(term.startDate), { weekStartsOn: 1 })

    for (let w = 0; w < 10; w++) {
      const monday = addDays(termStart, w * 7)
      const sunday = addDays(monday, 6)
      const mondayDate = format(monday, 'yyyy-MM-dd')
      const sundayDate = format(sunday, 'yyyy-MM-dd')

      const weekHolidays = holidays.filter((h) =>
        isWithinInterval(parseISO(h.date), { start: monday, end: sunday })
      )

      weeks.push({
        termName: term.name,
        termIndex: termIdx + 1,
        weekIndex: w + 1,
        label: `${term.name}, Week ${w + 1}`,
        mondayDate,
        sundayDate,
        holidays: weekHolidays,
      })
    }
  })

  return weeks
}

export function getCurrentAcademicWeek(weeks: AcademicWeek[], today: Date = new Date()): AcademicWeek | null {
  const todayStr = format(today, 'yyyy-MM-dd')
  return weeks.find((w) => w.mondayDate <= todayStr && todayStr <= w.sundayDate) ?? null
}

export function getAcademicWeekForDate(weeks: AcademicWeek[], dateStr: string): AcademicWeek | null {
  return weeks.find((w) => w.mondayDate <= dateStr && dateStr <= w.sundayDate) ?? null
}

export function getMondayOfWeek(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}
