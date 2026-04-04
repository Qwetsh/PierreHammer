import { useEffect } from 'react'
import { usePreferencesStore } from '@/stores/preferencesStore'

export function useColorVision() {
  const mode = usePreferencesStore((s) => s.colorVisionMode)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'normal') {
      root.removeAttribute('data-color-vision')
    } else {
      root.setAttribute('data-color-vision', mode)
    }
  }, [mode])
}
