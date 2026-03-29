import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ColumnId } from '../../types/task'
import { useTaskStore } from '../../stores/taskStore'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { ResizeHandle } from '../ui/ResizeHandle'
import { useResize } from '../../hooks/useResize'

export function KanbanBoard() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { tasks, taskOrder, moveTask, reorderTask, columns } = useTaskStore()

  const col1 = useResize({ direction: 'horizontal', initial: 240, min: 140, max: 500, invert: false, storageKey: 'studysesh-col1-width' })
  const col2 = useResize({ direction: 'horizontal', initial: 240, min: 140, max: 500, invert: false, storageKey: 'studysesh-col2-width' })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return

    const activeTask = tasks[active.id as string]
    if (!activeTask) return

    const overId = over.id as string

    // Dropped onto a column droppable
    if (columns.includes(overId as ColumnId)) {
      if (activeTask.columnId !== overId) {
        moveTask(active.id as string, overId as ColumnId)
      }
      return
    }

    // Dropped onto another task
    const overTask = tasks[overId]
    if (!overTask) return

    if (activeTask.columnId === overTask.columnId) {
      const colOrder = taskOrder[activeTask.columnId]
      const fromIndex = colOrder.indexOf(active.id as string)
      const toIndex = colOrder.indexOf(overId)
      if (fromIndex !== toIndex) reorderTask(activeTask.columnId, fromIndex, toIndex)
    } else {
      const toOrder = taskOrder[overTask.columnId]
      const toIndex = toOrder.indexOf(overId)
      moveTask(active.id as string, overTask.columnId, toIndex)
    }
  }

  const activeTask = activeId ? tasks[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex p-3 h-full min-h-0" style={{ gap: 0 }}>
        {/* Col 1 — fixed width */}
        <div style={{ width: `${col1.size}px`, flexShrink: 0, minWidth: 0, overflow: 'hidden' }}>
          <KanbanColumn columnId={columns[0]} />
        </div>

        <ResizeHandle direction="horizontal" onPointerDown={col1.onPointerDown} />

        {/* Col 2 — fixed width */}
        <div style={{ width: `${col2.size}px`, flexShrink: 0, minWidth: 0, overflow: 'hidden' }}>
          <KanbanColumn columnId={columns[1]} />
        </div>

        <ResizeHandle direction="horizontal" onPointerDown={col2.onPointerDown} />

        {/* Col 3 — fills remaining space */}
        <div style={{ flex: 1, minWidth: 140, overflow: 'hidden' }}>
          <KanbanColumn columnId={columns[2]} />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTask && <TaskCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
