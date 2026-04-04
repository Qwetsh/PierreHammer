import { useCallback } from 'react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { validateExportData } from '@/utils/storageValidator'
import type { CollectionItem } from '@/types/collection.types'

interface ExportData {
  version: 1
  exportedAt: string
  collection: Record<string, unknown>
  lists: Record<string, unknown>
  preferences: Record<string, unknown>
}

export function useExportImport() {
  const exportData = useCallback(() => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      collection: useCollectionStore.getState().items,
      lists: useListsStore.getState().lists,
      preferences: {
        activeFactionId: usePreferencesStore.getState().activeFactionId,
        activeListId: usePreferencesStore.getState().activeListId,
        locale: usePreferencesStore.getState().locale,
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `pierrehammer-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importData = useCallback(async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const validation = validateExportData(data)
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(' ') }
      }

      if (data.collection) {
        // Migrate old format (quantity + paintStatus) to new (instances)
        const migrated: Record<string, CollectionItem> = {}
        for (const [key, raw] of Object.entries(data.collection as Record<string, Record<string, unknown>>)) {
          if (Array.isArray(raw.instances)) {
            migrated[key] = raw as unknown as CollectionItem
          } else {
            const qty = (typeof raw.quantity === 'number' ? raw.quantity : 1)
            const status = (typeof raw.paintStatus === 'string' ? raw.paintStatus : 'unassembled')
            migrated[key] = {
              datasheetId: String(raw.datasheetId),
              factionId: String(raw.factionId),
              instances: Array(qty).fill(status),
            }
          }
        }
        useCollectionStore.setState({ items: migrated })
      }
      if (data.lists) {
        useListsStore.setState({ lists: data.lists })
      }
      if (data.preferences) {
        const prefs = data.preferences
        usePreferencesStore.setState({
          activeFactionId: prefs.activeFactionId ?? null,
          activeListId: prefs.activeListId ?? null,
          locale: prefs.locale ?? 'fr',
        })
      }

      return { success: true }
    } catch {
      return { success: false, error: 'Le fichier n\'est pas un JSON valide.' }
    }
  }, [])

  return { exportData, importData }
}
