import { useState, useEffect, useCallback } from 'react'
import { getCustomImageUrl, saveCustomImage, deleteCustomImage } from '@/stores/customImageStore'
import { uploadImage, deleteImage as deleteRemoteImage, downloadImage, hasRemoteImage } from '@/services/customImageSyncService'
import { useAuthStore } from '@/stores/authStore'
import { saveCustomImageBlob } from '@/stores/customImageStore'

/**
 * Hook to manage custom images for a datasheet.
 * Syncs with Supabase Storage when user is authenticated.
 */
export function useCustomImage(datasheetId: string) {
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    let revoked = false
    let currentUrl: string | null = null

    async function load() {
      // Try local first
      const localUrl = await getCustomImageUrl(datasheetId)
      if (localUrl) {
        if (!revoked) {
          currentUrl = localUrl
          setCustomImageUrl(localUrl)
          setLoading(false)
        } else {
          URL.revokeObjectURL(localUrl)
        }
        return
      }

      // If not local but user is connected, try remote (only if image exists)
      if (user && await hasRemoteImage(user.id, datasheetId)) {
        const blob = await downloadImage(user.id, datasheetId)
        if (blob && !revoked) {
          await saveCustomImageBlob(datasheetId, blob)
          const url = URL.createObjectURL(blob)
          currentUrl = url
          setCustomImageUrl(url)
          setLoading(false)
          return
        }
      }

      if (!revoked) setLoading(false)
    }

    load()

    return () => {
      revoked = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [datasheetId, user])

  const save = useCallback(
    async (file: File | Blob) => {
      if (customImageUrl) URL.revokeObjectURL(customImageUrl)
      const url = await saveCustomImage(datasheetId, file)
      setCustomImageUrl(url)

      // Sync to remote in background
      if (user) {
        const { getCustomImageBlob } = await import('@/stores/customImageStore')
        const blob = await getCustomImageBlob(datasheetId)
        if (blob) uploadImage(user.id, datasheetId, blob)
      }
    },
    [datasheetId, customImageUrl, user],
  )

  const remove = useCallback(async () => {
    if (customImageUrl) URL.revokeObjectURL(customImageUrl)
    await deleteCustomImage(datasheetId)
    setCustomImageUrl(null)

    // Delete from remote in background
    if (user) {
      deleteRemoteImage(user.id, datasheetId)
    }
  }, [datasheetId, customImageUrl, user])

  return { customImageUrl, loading, save, remove }
}
