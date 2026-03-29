import { Priority } from '../../types/task'

const configs: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'High', color: '#ef4444', bg: '#ef444422' },
  medium: { label: 'Med',  color: '#f59e0b', bg: '#f59e0b22' },
  low:    { label: 'Low',  color: '#10b981', bg: '#10b98122' },
}

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'xs'
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const c = configs[priority]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      }`}
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </span>
  )
}
