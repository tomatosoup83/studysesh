import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClass} rounded-xl shadow-2xl`}
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {title && (
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
