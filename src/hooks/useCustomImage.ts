import { useState, useEffect, useCallback } from 'react'
import { getCustomImageUrl, saveCustomImage, deleteCustomImage } from '@/stores/customImageStore'

/**
 * Hook to manage custom images for a datasheet.
 * Returns the custom image URL (or null) and functions to save/delete.
 */
export function useCustomImage(datasheetId: string) {
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let revoked = false
    let currentUrl: string | null = null

    getCustomImageUrl(datasheetId).then((url) => {
      if (!revoked) {
        currentUrl = url
        setCustomImageUrl(url)
        setLoading(false)
      } else if (url) {
        URL.revokeObjectURL(url)
      }
    })

    return () => {
      revoked = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [datasheetId])

  const save = useCallback(
    async (file: File | Blob) => {
      if (customImageUrl) URL.revokeObjectURL(customImageUrl)
      const url = await saveCustomImage(datasheetId, file)
      setCustomImageUrl(url)
    },
    [datasheetId, customImageUrl],
  )

  const remove = useCallback(async () => {
    if (customImageUrl) URL.revokeObjectURL(customImageUrl)
    await deleteCustomImage(datasheetId)
    setCustomImageUrl(null)
  }, [datasheetId, customImageUrl])

  return { customImageUrl, loading, save, remove }
}
