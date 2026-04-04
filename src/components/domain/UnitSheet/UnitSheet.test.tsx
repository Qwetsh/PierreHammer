import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnitSheet } from './UnitSheet'
import type { Datasheet } from '@/types/gameData.types'

const baseDatasheet: Datasheet = {
  id: 'ds-1',
  name: 'Intercessors',
  factionId: 'f-1',
  sourceId: 'src-1',
  role: 'Troops',
  unitComposition: '5-10 Intercessor models',
  transport: '',
  leader: '',
  loadout: 'Every model is equipped with: bolt rifle, bolt pistol, close combat weapon.',
  damagedDescription: '',
  damagedRange: '',
  keywords: [
    { keyword: 'Infantry', model: '', isFactionKeyword: false },
    { keyword: 'Adeptus Astartes', model: '', isFactionKeyword: true },
  ],
  profiles: [
    { name: 'Intercessor', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '2', invSv: '', invSvDescr: '' },
  ],
  weapons: [
    { name: 'Bolt rifle', type: 'Ranged', range: '24"', A: '2', BS_WS: '3+', S: '4', AP: '-1', D: '1', abilities: '' },
    { name: 'Close combat weapon', type: 'Melee', range: 'Melee', A: '3', BS_WS: '3+', S: '4', AP: '0', D: '1', abilities: '' },
  ],
  abilities: [
    { id: 'ab-1', name: 'Oath of Moment', description: 'Re-roll hits against a target.', type: 'faction', parameter: '' },
  ],
  pointOptions: [{ cost: 90, models: '5 models' }],
}

describe('UnitSheet', () => {
  it('renders the unit name in the header', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Intercessors')).toBeInTheDocument()
  })

  it('renders point costs', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('90 pts (5 models)')).toBeInTheDocument()
  })

  it('renders Epic Hero badge when keyword present', () => {
    const epicHero: Datasheet = {
      ...baseDatasheet,
      keywords: [...baseDatasheet.keywords, { keyword: 'Epic Hero', model: '', isFactionKeyword: false }],
    }
    render(<UnitSheet datasheet={epicHero} />)
    const badges = screen.getAllByText('Epic Hero')
    // One in the header badge, one in the keywords section
    expect(badges.length).toBe(2)
  })

  it('does not render Epic Hero badge when keyword absent', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.queryByText('Epic Hero')).not.toBeInTheDocument()
  })

  it('renders profile table with stats', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Profil')).toBeInTheDocument()
    expect(screen.getByText('Intercessor')).toBeInTheDocument()
    expect(screen.getByText('6"')).toBeInTheDocument()
    // 3+ appears in both profile (Sv) and weapons (BS_WS) — check at least one exists
    expect(screen.getAllByText('3+').length).toBeGreaterThanOrEqual(1)
  })

  it('renders ranged weapons table', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Armes de tir')).toBeInTheDocument()
    expect(screen.getByText('Bolt rifle')).toBeInTheDocument()
    expect(screen.getByText('24"')).toBeInTheDocument()
  })

  it('renders melee weapons table', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Armes de mêlée')).toBeInTheDocument()
    expect(screen.getByText('Close combat weapon')).toBeInTheDocument()
  })

  it('renders abilities', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Capacités')).toBeInTheDocument()
    expect(screen.getByText('Oath of Moment')).toBeInTheDocument()
  })

  it('renders keywords with faction keyword styling', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Mots-clés')).toBeInTheDocument()
    expect(screen.getByText('Infantry')).toBeInTheDocument()
    expect(screen.getByText('Adeptus Astartes')).toBeInTheDocument()
  })

  it('renders composition section', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Composition')).toBeInTheDocument()
    expect(screen.getByText('5-10 Intercessor models')).toBeInTheDocument()
  })

  it('renders loadout section', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    expect(screen.getByText('Équipement')).toBeInTheDocument()
  })

  it('renders disabled add-to-list button', () => {
    render(<UnitSheet datasheet={baseDatasheet} />)
    const btn = screen.getByText('Ajouter à une liste')
    expect(btn.closest('button')).toBeDisabled()
  })

  it('does not render PaintStatusBadge (moved to collection)', () => {
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={1} />)
    expect(screen.queryByLabelText('Terminée')).not.toBeInTheDocument()
  })

  it('shows "Non possédé" when ownedCount is 0', () => {
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={0} />)
    expect(screen.getByText('Non possédé')).toBeInTheDocument()
  })

  it('shows "Possédé: N" when ownedCount > 0', () => {
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={3} />)
    expect(screen.getByText('Possédé: 3')).toBeInTheDocument()
  })

  it('shows add-to-collection button when not owned', () => {
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={0} />)
    expect(screen.getByText('Ajouter à ma collection')).toBeInTheDocument()
  })

  it('calls onAddToCollection when button clicked', async () => {
    const handleAdd = vi.fn()
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={0} onAddToCollection={handleAdd} />)
    await userEvent.click(screen.getByText('Ajouter à ma collection'))
    expect(handleAdd).toHaveBeenCalledOnce()
  })

  it('shows quantity controls when owned', () => {
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={2} />)
    expect(screen.getByLabelText('Diminuer la quantité')).toBeInTheDocument()
    expect(screen.getByLabelText('Augmenter la quantité')).toBeInTheDocument()
    expect(screen.getByText('Possédé: 2')).toBeInTheDocument()
  })

  it('calls onUpdateQuantity with incremented value', async () => {
    const handleUpdate = vi.fn()
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={2} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByLabelText('Augmenter la quantité'))
    expect(handleUpdate).toHaveBeenCalledWith(3)
  })

  it('calls onUpdateQuantity with decremented value', async () => {
    const handleUpdate = vi.fn()
    render(<UnitSheet datasheet={baseDatasheet} ownedCount={2} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByLabelText('Diminuer la quantité'))
    expect(handleUpdate).toHaveBeenCalledWith(1)
  })

  it('hides sections when data is empty', () => {
    const minimal: Datasheet = {
      ...baseDatasheet,
      profiles: [],
      weapons: [],
      abilities: [],
      keywords: [],
      pointOptions: [],
      unitComposition: '',
      loadout: '',
    }
    render(<UnitSheet datasheet={minimal} />)
    expect(screen.queryByText('Profil')).not.toBeInTheDocument()
    expect(screen.queryByText('Armes de tir')).not.toBeInTheDocument()
    expect(screen.queryByText('Armes de mêlée')).not.toBeInTheDocument()
    expect(screen.queryByText('Capacités')).not.toBeInTheDocument()
    expect(screen.queryByText('Mots-clés')).not.toBeInTheDocument()
    expect(screen.queryByText('Composition')).not.toBeInTheDocument()
    expect(screen.queryByText('Équipement')).not.toBeInTheDocument()
  })
})
