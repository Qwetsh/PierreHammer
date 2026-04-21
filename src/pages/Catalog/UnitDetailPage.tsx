import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { UnitSheet } from '@/components/domain/UnitSheet'
import { Button } from '@/components/ui/Button'

export function UnitDetailPage() {
  const { factionId, unitId } = useParams<{ factionId: string; unitId: string }>()
  const navigate = useNavigate()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  useFactionTheme(factionId ?? null)

  useEffect(() => {
    if (factionId && !loadedFactions[factionId]) {
      loadFaction(factionId)
    }
  }, [factionId, loadedFactions, loadFaction])

  const collectionItem = useCollectionStore((s) => unitId ? s.items[unitId] : undefined)
  const addItem = useCollectionStore((s) => s.addItem)
  const addInstance = useCollectionStore((s) => s.addInstance)
  const removeInstance = useCollectionStore((s) => s.removeInstance)

  const allLists = useListsStore((s) => s.getAllLists)
  const addUnit = useListsStore((s) => s.addUnit)

  const [showListPicker, setShowListPicker] = useState(false)

  const faction = factionId ? loadedFactions[factionId] : undefined
  const datasheet = faction?.datasheets.find((ds) => ds.id === unitId)

  if (!faction || !datasheet || !factionId || !unitId) {
    return (
      <div className="p-4" style={{ color: 'var(--color-text-muted)' }}>
        Unité introuvable.
      </div>
    )
  }

  const points = datasheet.pointOptions.length > 0 ? datasheet.pointOptions[0].cost : 0
  const ownedCount = collectionItem?.instances.length ?? 0

  const enhancementGroups = useMemo(() => {
    if (!isCharacter(datasheet) || !faction?.detachments) return []
    return faction.detachments
      .map((det) => ({
        detachmentName: det.name,
        enhancements: (det.enhancements ?? []).filter((e) => canEquipEnhancement(e, datasheet)),
      }))
      .filter((g) => g.enhancements.length > 0)
  }, [datasheet, faction])

  const handleAddToList = () => {
    const lists = allLists().filter((l) => l.factionId === factionId)
    if (lists.length === 0) {
      navigate('/lists')
      return
    }
    if (lists.length === 1) {
      addUnit(lists[0].id, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), datasheetId: unitId, datasheetName: datasheet.name, points, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
      return
    }
    setShowListPicker(true)
  }

  const handleSelectList = (listId: string) => {
    addUnit(listId, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), datasheetId: unitId, datasheetName: datasheet.name, points, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    setShowListPicker(false)
  }

  const handleUpdateQuantity = (qty: number) => {
    if (!collectionItem) return
    if (qty > ownedCount) {
      addInstance(unitId)
    } else if (qty < ownedCount && qty >= 0) {
      removeInstance(unitId, ownedCount - 1)
    }
  }

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="p-4"
    >
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
      </div>
      <UnitSheet
        datasheet={datasheet}
        ownedCount={ownedCount}
        enhancementGroups={enhancementGroups}
        onAddToCollection={() => addItem(unitId, factionId)}
        onUpdateQuantity={handleUpdateQuantity}
        onAddToList={handleAddToList}
      />

      {showListPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowListPicker(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-xl p-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Ajouter à quelle liste ?
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              {allLists()
                .filter((l) => l.factionId === factionId)
                .map((list) => (
                  <button
                    key={list.id}
                    className="text-left p-3 rounded-lg cursor-pointer border-none min-h-[44px]"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    onClick={() => handleSelectList(list.id)}
                  >
                    <span className="font-medium">{list.name}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                      {list.units.reduce((s, u) => {
                        const ds = faction?.datasheets.find((d) => d.id === u.datasheetId)
                        return s + (ds && ds.pointOptions.length > 0 ? ds.pointOptions[0].cost : u.points)
                      }, 0)}/{list.pointsLimit} pts
                    </span>
                  </button>
                ))}
            </div>
            <Button variant="ghost" onClick={() => setShowListPicker(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
