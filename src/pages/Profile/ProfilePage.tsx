import { useRef } from 'react'
import { useExportImport } from '@/hooks/useExportImport'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { usePreferencesStore, type ColorVisionMode } from '@/stores/preferencesStore'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const COLOR_VISION_OPTIONS: { value: ColorVisionMode; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Vision standard' },
  { value: 'deuteranopia', label: 'Deuteranopie', description: 'Difficulté rouge-vert (la plus courante)' },
  { value: 'protanopia', label: 'Protanopie', description: 'Difficulté rouge-vert' },
  { value: 'tritanopia', label: 'Tritanopie', description: 'Difficulté bleu-jaune' },
]

export function ProfilePage() {
  const { exportData, importData } = useExportImport()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const collectionCount = Object.keys(useCollectionStore((s) => s.items)).length
  const listsCount = Object.keys(useListsStore((s) => s.lists)).length
  const colorVisionMode = usePreferencesStore((s) => s.colorVisionMode)
  const setColorVisionMode = usePreferencesStore((s) => s.setColorVisionMode)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const hasData = collectionCount > 0 || listsCount > 0
    if (hasData && !window.confirm('Cela va remplacer toutes tes données actuelles. Continuer ?')) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const result = await importData(file)
    if (result.success) {
      showToast('Données importées avec succès !', 'success')
    } else {
      showToast(`Fichier invalide: ${result.error}`, 'error')
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6" style={{ fontSize: 'var(--text-2xl)' }}>Profil</h1>

      <div className="flex flex-col gap-4 mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Mes données</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {collectionCount} unité{collectionCount !== 1 ? 's' : ''} dans ma collection
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {listsCount} liste{listsCount !== 1 ? 's' : ''} d'armée
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Accessibilité</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Adapte les couleurs pour les personnes daltoniennes.
          </p>
          <div className="flex flex-col gap-1.5">
            {COLOR_VISION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left border-none cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: colorVisionMode === opt.value ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: colorVisionMode === opt.value ? '#ffffff' : 'var(--color-text)',
                }}
                onClick={() => setColorVisionMode(opt.value)}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border-2"
                  style={{
                    borderColor: colorVisionMode === opt.value ? '#ffffff' : 'var(--color-text-muted)',
                    backgroundColor: colorVisionMode === opt.value ? '#ffffff' : 'transparent',
                  }}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs" style={{ opacity: 0.7 }}>{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Sauvegarde</h2>
        <Button variant="secondary" onClick={exportData}>
          Exporter mes données
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          Importer mes données
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
          aria-label="Importer un fichier JSON"
        />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          L'import remplace toutes les données existantes. Exporte d'abord si tu veux garder tes données actuelles.
        </p>
      </div>

      <div className="mt-8 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>À propos</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
          PierreHammer — Companion app Warhammer 40K
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Créé avec amour par Thomas pour Pierre.
        </p>
      </div>
    </div>
  )
}
