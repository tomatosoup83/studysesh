import { useCallback, useEffect, useRef, useState } from 'react'

interface UseResizeOptions {
  direction: 'horizontal' | 'vertical'
  initial: number
  min: number
  max: number
  /** When true (default), dragging toward positive axis shrinks the panel (right-side panels).
   *  When false, dragging toward positive axis grows the panel (left/top-side panels). */
  invert?: boolean
  storageKey?: string
}

export function useResize({ direction, initial, min, max, invert = true, storageKey }: UseResizeOptions) {
  const stored = storageKey ? Number(localStorage.getItem(storageKey)) || initial : initial
  const [size, setSize] = useState(stored)
  const dragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    startSize.current = size
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [direction, size])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const delta = direction === 'horizontal'
        ? e.clientX - startPos.current
        : e.clientY - startPos.current
      const next = Math.min(max, Math.max(min, invert ? startSize.current - delta : startSize.current + delta))
      setSize(next)
      if (storageKey) localStorage.setItem(storageKey, String(next))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [direction, min, max, storageKey])

  return { size, onPointerDown }
}
