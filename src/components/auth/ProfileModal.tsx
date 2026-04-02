import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  open: boolean
  onClose: () => void
}

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 256
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ProfileModal({ open, onClose }: Props) {
  const { user, isLoading, updateProfile } = useAuthStore()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarBase64 ?? null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await resizeImageToBase64(file)
      setAvatarPreview(b64)
    } catch {
      setError('Could not load image')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const updates: { displayName?: string; password?: string; avatarBase64?: string | null } = {}

    if (displayName.trim() && displayName.trim() !== user.displayName) {
      updates.displayName = displayName.trim()
    }
    if (newPassword) {
      if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
      if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
      updates.password = newPassword
    }
    if (avatarPreview !== user.avatarBase64) {
      updates.avatarBase64 = avatarPreview
    }

    if (Object.keys(updates).length === 0) { onClose(); return }

    try {
      await updateProfile(updates)
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(onClose, 800)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const initials = user.displayName.slice(0, 2).toUpperCase()

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="sm">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
        {avatarPreview && (
          <button type="button" onClick={() => setAvatarPreview(null)} className="text-xs w-full text-center" style={{ color: 'var(--color-text-muted)' }}>
            Remove photo
          </button>
        )}

        {/* Display name */}
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Password section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {showPassword ? 'Cancel password change' : 'Change password'}
          </button>
          {showPassword && (
            <div className="space-y-2">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{error}</p>}
        {success && <p className="text-xs" style={{ color: 'var(--color-success, #10b981)' }}>Saved!</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          {isLoading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </Modal>
  )
}
