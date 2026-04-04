import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useGameData } from '@/hooks/useGameData'
import { useSearch } from '@/hooks/useSearch'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useCollectionStore } from '@/stores/collectionStore'
import type { Datasheet } from '@/types/gameData.types'

const extractSearchFields = (ds: Datasheet): string[] => [
  ds.name,
  ...ds.keywords.map((k) => k.keyword),
]

export function CatalogPage() {
  const navigate = useNavigate()
  const { factionIndex, selectedFaction, selectedFactionSlug, isLoading, error, loadFaction, selectFaction } = useGameData()
  const [query, setQuery] = useState('')
  const collectionItems = useCollectionStore((s) => s.items)

  const extractFields = useCallback(extractSearchFields, [])
  const filteredDatasheets = useSearch(selectedFaction?.datasheets ?? [], query, extractFields)

  if (error) {
    return (
      <div className="p-4" style={{ color: 'var(--color-error)' }}>
        Erreur: {error}
      </div>
    )
  }

  if (isLoading && !factionIndex) {
    return (
      <div className="p-4" style={{ color: 'var(--color-text-muted)' }}>
        Chargement...
      </div>
    )
  }

  if (!selectedFaction && factionIndex) {
    return (
      <div>
        <div className="p-4">
          <h1 className="text-2xl font-bold" style={{ fontSize: 'var(--text-2xl)' }}>
            Catalogue
          </h1>
          {factionIndex.lastUpdate && (
            <p className="mt-1" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Données à jour au {factionIndex.lastUpdate}
            </p>
          )}
        </div>
        <FactionPicker factions={factionIndex.factions} onSelect={loadFaction} />
      </div>
    )
  }

  if (selectedFaction) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontSize: 'var(--text-2xl)' }}>
              {selectedFaction.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {filteredDatasheets.length} unité{filteredDatasheets.length !== 1 ? 's' : ''} trouvée{filteredDatasheets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => selectFaction(null)}>
            Changer
          </Button>
        </div>

        <div className="mb-4">
          <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
        </div>

        {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>}

        {filteredDatasheets.length === 0 && query.trim().length >= 2 ? (
          <EmptyState
            title="Aucune unité trouvée"
            description={`Aucune unité trouvée pour '${query.trim()}'`}
            actionLabel="Effacer la recherche"
            onAction={() => setQuery('')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredDatasheets.map((ds) => (
              <UnitCard
                key={ds.id}
                datasheet={ds}
                owned={collectionItems[ds.id]?.quantity}
                paintStatus={collectionItems[ds.id]?.paintStatus}
                onClick={() => navigate(`/catalog/${selectedFactionSlug}/${ds.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
