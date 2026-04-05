import { useEffect, useState } from 'react'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { useToastStore, Toast, ToastVariant } from '../../stores/toastStore'

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: 'var(--color-success)',
  info: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()
  const [exiting, setExiting] = useState(false)

  const Icon = VARIANT_ICON[toast.variant]
  const color = VARIANT_COLOR[toast.variant]

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => removeToast(toast.id), 180)
  }

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), toast.duration - 200)
    return () => clearTimeout(t)
  }, [toast.duration])

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderRadius: 10,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        minWidth: 220,
        maxWidth: 340,
        pointerEvents: 'all',
      }}
    >
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)', flex: 1 }}>{toast.message}</span>
      <button onClick={dismiss} style={{ color: 'var(--color-text-muted)', flexShrink: 0, lineHeight: 0 }}>
        <X size={12} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()
  if (!toasts.length) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
