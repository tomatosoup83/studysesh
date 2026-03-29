interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onPointerDown: (e: React.PointerEvent) => void
}

export function ResizeHandle({ direction, onPointerDown }: ResizeHandleProps) {
  const isH = direction === 'horizontal'
  return (
    <div
      onPointerDown={onPointerDown}
      className="group flex items-center justify-center flex-shrink-0 select-none"
      style={{
        width: isH ? '8px' : '100%',
        height: isH ? '100%' : '8px',
        cursor: isH ? 'col-resize' : 'row-resize',
        zIndex: 10,
      }}
    >
      <div
        className="rounded-full transition-all group-hover:opacity-100"
        style={{
          width: isH ? '3px' : '32px',
          height: isH ? '32px' : '3px',
          background: 'var(--color-border)',
          opacity: 0.5,
          transition: 'background 0.15s, opacity 0.15s',
        }}
        // Highlight on active drag via CSS via parent pointer-down state
      />
    </div>
  )
}
