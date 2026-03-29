import { useState } from 'react'
import { useUserStore } from '../../stores/userStore'
import { Modal } from '../ui/Modal'

export function UserNameModal() {
  const { userName, setUserName } = useUserStore()
  const [input, setInput] = useState('')

  if (userName) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed) setUserName(trimmed)
  }

  return (
    <Modal open onClose={() => {}} title="Welcome to StudySesh" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your name so your study group can see your progress on the scoreboard.
        </p>
        <input
          autoFocus
          type="text"
          placeholder="Your name"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={32}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          Let's go
        </button>
      </form>
    </Modal>
  )
}
