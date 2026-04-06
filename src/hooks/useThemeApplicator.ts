import { useEffect } from 'react'
import { useSettingsStore, CSS_VAR_KEYS } from '../stores/settingsStore'

export function useThemeApplicator() {
  const { theme, customThemeVars } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    CSS_VAR_KEYS.forEach((k) => root.style.removeProperty(k))
    if (theme === 'custom') {
      root.removeAttribute('data-theme')
      Object.entries(customThemeVars).forEach(([k, v]) => root.style.setProperty(k, v))
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme, customThemeVars])
}
