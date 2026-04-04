import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PartySwiper } from '@/features/game-mode/components/PartySwiper'
import { calculateTotalPoints, resolveUnitPoints } from '@/utils/pointsCalculator'
import type { Datasheet } from '@/types/gameData.types'

export function GameModePage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const [swiperStartIndex, setSwiperStartIndex] = useState<number | null>(null)

  useEffect(() => {
    if (list) {
      loadFaction(list.factionId)
    }
  }, [list, loadFaction])

  if (!list || !listId) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Retour
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Liste introuvable"
            description="Cette liste n'existe plus."
            actionLabel="Voir mes listes"
            onAction={() => navigate('/lists')}
          />
        </div>
      </motion.div>
    )
  }

  const faction = loadedFactions[list.factionId]
  const totalPoints = calculateTotalPoints(list.units, faction?.datasheets)

  const unitDatasheets: Datasheet[] = list.units
    .map((unit) => faction?.datasheets.find((ds) => ds.id === unit.datasheetId))
    .filter((ds): ds is Datasheet => ds !== undefined)

  if (swiperStartIndex !== null && unitDatasheets.length > 0) {
    return (
      <PartySwiper
        datasheets={unitDatasheets}
        initialIndex={swiperStartIndex}
        onClose={() => setSwiperStartIndex(null)}
      />
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between p-3"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col">
          <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            {list.name}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {list.detachment} · {totalPoints}/{list.pointsLimit} pts
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          Quitter
        </Button>
      </div>

      <div className="flex-1 p-4">
        {list.units.length === 0 ? (
          <EmptyState
            title="Liste vide"
            description="Ajoute des unités à ta liste avant de lancer le mode partie."
            actionLabel="Modifier la liste"
            onAction={() => navigate(`/lists/${listId}`)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {list.units.map((listUnit, i) => {
              const datasheet = faction?.datasheets.find((ds) => ds.id === listUnit.datasheetId)
              return (
                <button
                  key={i}
                  className="flex items-center justify-between rounded-lg p-3 min-h-[44px] w-full text-left"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                  onClick={() => {
                    if (!datasheet) return
                    const idx = unitDatasheets.indexOf(datasheet)
                    if (idx >= 0) setSwiperStartIndex(idx)
                  }}
                  disabled={!datasheet}
                >
                  <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                    {listUnit.datasheetName}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                    {resolveUnitPoints(listUnit, faction?.datasheets)} pts
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
