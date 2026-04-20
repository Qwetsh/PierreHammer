import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PartySwiper } from '@/features/game-mode/components/PartySwiper'
import { calculateTotalPoints, resolveUnitPoints } from '@/utils/pointsCalculator'
import type { Datasheet, Detachment } from '@/types/gameData.types'

export function GameModePage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const [swiperStartIndex, setSwiperStartIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'units' | 'stratagems'>('units')
  const [usedStratagems, setUsedStratagems] = useState<Set<string>>(new Set())

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

  const detachment: Detachment | undefined = faction?.detachments?.find(
    (d) => d.id === list.detachmentId || d.name === list.detachment,
  )

  const toggleStratagem = (id: string) => {
    setUsedStratagems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
        className="sticky top-0 z-10 p-3"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between mb-2">
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

        {detachment && detachment.stratagems.length > 0 && (
          <div className="flex gap-1">
            <button
              className="flex-1 text-xs py-1.5 rounded-lg cursor-pointer border-none font-medium"
              style={{
                backgroundColor: activeTab === 'units' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: activeTab === 'units' ? '#fff' : 'var(--color-text-muted)',
              }}
              onClick={() => setActiveTab('units')}
            >
              Unités ({list.units.length})
            </button>
            <button
              className="flex-1 text-xs py-1.5 rounded-lg cursor-pointer border-none font-medium"
              style={{
                backgroundColor: activeTab === 'stratagems' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: activeTab === 'stratagems' ? '#fff' : 'var(--color-text-muted)',
              }}
              onClick={() => setActiveTab('stratagems')}
            >
              Stratagèmes ({detachment.stratagems.length})
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'units' && (
          <>
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
                      <div className="flex flex-col">
                        <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                          {listUnit.datasheetName}
                        </span>
                        {listUnit.enhancement && (
                          <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
                            ✦ {listUnit.enhancement.enhancementName} (+{listUnit.enhancement.cost} pts)
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        {resolveUnitPoints(listUnit, faction?.datasheets)} pts
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'stratagems' && detachment && (
          <div className="flex flex-col gap-3">
            {detachment.rule && (
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface)', borderLeft: '3px solid var(--color-accent)' }}
              >
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-accent)' }}>
                  {detachment.rule.name}
                </h3>
                {detachment.rule.legend && (
                  <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {detachment.rule.legend}
                  </p>
                )}
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                  dangerouslySetInnerHTML={{ __html: detachment.rule.description }}
                />
              </div>
            )}

            {detachment.stratagems.map((strat) => {
              const isUsed = usedStratagems.has(strat.id)
              return (
                <button
                  key={strat.id}
                  className="rounded-lg p-3 text-left w-full cursor-pointer border-none"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    opacity: isUsed ? 0.5 : 1,
                    borderLeft: `3px solid ${strat.type.includes('Battle Tactic') ? '#b33b3b' : strat.type.includes('Strategic Ploy') ? '#5a8cc4' : strat.type.includes('Epic Deed') ? '#9b6bc4' : 'var(--color-accent)'}`,
                  }}
                  onClick={() => toggleStratagem(strat.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {strat.name}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}
                    >
                      {strat.cpCost} CP
                    </span>
                  </div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {strat.turn && <span>{strat.turn}</span>}
                    {strat.turn && strat.phase && <span> · </span>}
                    {strat.phase && <span>{strat.phase}</span>}
                  </div>
                  {strat.legend && (
                    <p className="text-xs italic mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {strat.legend}
                    </p>
                  )}
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--color-text)' }}
                    dangerouslySetInnerHTML={{ __html: strat.description }}
                  />
                  {isUsed && (
                    <span className="text-xs mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
                      (utilisé — appuyer pour réactiver)
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
