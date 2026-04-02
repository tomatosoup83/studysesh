import { Modal } from '../ui/Modal'
import { useTaskStore } from '../../stores/taskStore'
import { COLUMNS, type ColumnId } from '../../types/task'

const SLICE_COLORS: Record<ColumnId, string> = {
  'not-started': 'var(--color-text-muted)',
  'in-progress': 'var(--color-primary)',
  'completed':   'var(--color-success)',
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function slicePath(cx: number, cy: number, R: number, iR: number, start: number, end: number): string {
  const sweep = Math.min(end - start, 2 * Math.PI - 0.001)
  const e = start + sweep
  const large = sweep > Math.PI ? 1 : 0
  const os = polarToCartesian(cx, cy, R, start)
  const oe = polarToCartesian(cx, cy, R, e)
  const is_ = polarToCartesian(cx, cy, iR, start)
  const ie = polarToCartesian(cx, cy, iR, e)
  return `M ${os.x} ${os.y} A ${R} ${R} 0 ${large} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${iR} ${iR} 0 ${large} 0 ${is_.x} ${is_.y} Z`
}

interface Props {
  open: boolean
  onClose: () => void
}

export function TaskStatsModal({ open, onClose }: Props) {
  const { taskOrder } = useTaskStore()

  const counts: Record<ColumnId, number> = {
    'not-started': taskOrder['not-started'].length,
    'in-progress': taskOrder['in-progress'].length,
    'completed':   taskOrder['completed'].length,
  }
  const total = counts['not-started'] + counts['in-progress'] + counts['completed']

  const CX = 80, CY = 80, R = 70, IR = 42, GAP = 0.03

  let cursor = -Math.PI / 2
  const slices = COLUMNS.map(({ id }) => {
    const count = counts[id]
    const angle = total > 0 ? (count / total) * 2 * Math.PI : 0
    const start = cursor + GAP / 2
    const end = cursor + angle - GAP / 2
    cursor += angle
    return { id, count, start, end, angle }
  })

  return (
    <Modal open={open} onClose={onClose} title="Task Overview" size="sm">
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-3xl" style={{ color: 'var(--color-text-muted)' }}>—</span>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No tasks yet</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <svg viewBox="0 0 160 160" width="160" height="160">
              {slices.map(({ id, count, start, end, angle }) =>
                count === 0 || angle <= GAP ? null : (
                  <path
                    key={id}
                    d={slicePath(CX, CY, R, IR, start, end)}
                    fill={SLICE_COLORS[id]}
                  />
                )
              )}
              <text
                x="80" y="78"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: 'var(--color-text-primary)', fontSize: '20px', fontWeight: 'bold' }}
              >
                {total}
              </text>
              <text
                x="80" y="94"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: 'var(--color-text-muted)', fontSize: '9px' }}
              >
                tasks
              </text>
            </svg>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {COLUMNS.map(({ id, label }) => (
              <div key={id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: SLICE_COLORS[id] }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {counts[id]}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--color-text-muted)', minWidth: '2.5rem', textAlign: 'right' }}>
                    {Math.round((counts[id] / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
