import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { GameModePage } from './GameModePage'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import type { ArmyList } from '@/types/armyList.types'
import type { Faction } from '@/types/gameData.types'

const mockList: ArmyList = {
  id: 'list-1',
  name: 'Space Wolves Alpha',
  factionId: 'space-marines',
  detachment: 'Gladius',
  pointsLimit: 2000,
  units: [
    { datasheetId: 'ds-1', datasheetName: 'Intercessors', points: 100, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' },
    { datasheetId: 'ds-2', datasheetName: 'Redemptor Dreadnought', points: 210, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' },
  ],
  createdAt: 1000,
}

const mockFaction: Faction = {
  id: 'space-marines',
  name: 'Space Marines',
  slug: 'space-marines',
  datasheets: [
    {
      id: 'ds-1',
      name: 'Intercessors',
      factionId: 'space-marines',
      sourceId: 'src-1',
      role: 'Troops',
      unitComposition: '5 models',
      transport: '',
      leader: '',
      loadout: '',
      keywords: [],
      damagedDescription: '',
      damagedRange: '',
      profiles: [{ name: 'Intercessor', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '2', invSv: '', invSvDescr: '' }],
      weapons: [],
      abilities: [],
      pointOptions: [{ cost: 100, models: '5' }],
    },
  ],
}

function renderGameMode(listId = 'list-1') {
  return render(
    <MemoryRouter initialEntries={[`/game-mode/${listId}`]}>
      <Routes>
        <Route path="/game-mode/:listId" element={<GameModePage />} />
        <Route path="/lists" element={<div>Lists page</div>} />
        <Route path="/lists/:listId" element={<div>List detail</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GameModePage', () => {
  beforeEach(() => {
    useListsStore.setState({ lists: {} })
    useGameDataStore.setState({ loadedFactions: {}, factionIndex: null, selectedFactionSlug: null, isLoading: false, error: null })
  })

  it('shows empty state when list not found', () => {
    renderGameMode('nonexistent')
    expect(screen.getByText('Liste introuvable')).toBeInTheDocument()
  })

  it('shows list name and detachment in header', () => {
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()
    expect(screen.getByText('Space Wolves Alpha')).toBeInTheDocument()
    expect(screen.getByText(/Gladius/)).toBeInTheDocument()
  })

  it('shows units from the list', () => {
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()
    expect(screen.getByText('Intercessors')).toBeInTheDocument()
    expect(screen.getByText('Redemptor Dreadnought')).toBeInTheDocument()
  })

  it('shows points for each unit', () => {
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()
    expect(screen.getByText('100 pts')).toBeInTheDocument()
    expect(screen.getByText('210 pts')).toBeInTheDocument()
  })

  it('shows total points in header', () => {
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()
    expect(screen.getByText(/310\/2000 pts/)).toBeInTheDocument()
  })

  it('shows quit button', () => {
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()
    expect(screen.getByText('Quitter')).toBeInTheDocument()
  })

  it('shows empty state for list with no units', () => {
    const emptyList = { ...mockList, units: [] }
    useListsStore.setState({ lists: { 'list-1': emptyList } })
    renderGameMode()
    expect(screen.getByText('Liste vide')).toBeInTheDocument()
  })

  it('opens unit sheet when clicking a unit', async () => {
    const user = userEvent.setup()
    useListsStore.setState({ lists: { 'list-1': mockList } })
    useGameDataStore.setState({ loadedFactions: { 'space-marines': mockFaction } })
    renderGameMode()

    await user.click(screen.getByText('Intercessors'))
    // UnitSheet should render profile data
    expect(screen.getByText('6"')).toBeInTheDocument()
  })
})
