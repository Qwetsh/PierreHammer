import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnitCard } from './UnitCard'
import type { Datasheet } from '@/types/gameData.types'

const baseDatasheet: Datasheet = {
  id: '1',
  name: 'Intercessor Squad',
  factionId: 'SM',
  sourceId: '',
  role: 'Troops',
  unitComposition: '',
  transport: '',
  leader: '',
  loadout: '',
  keywords: [{ keyword: 'BATTLELINE', model: '', isFactionKeyword: false }],
  damagedDescription: '',
  damagedRange: '',
  profiles: [],
  weapons: [],
  abilities: [],
  pointOptions: [{ cost: 80, models: '5' }],
}

describe('UnitCard', () => {
  it('renders unit name and points', () => {
    render(<UnitCard datasheet={baseDatasheet} />)
    expect(screen.getByText('Intercessor Squad')).toBeInTheDocument()
    expect(screen.getByText('80', { exact: false })).toBeInTheDocument()
  })

  it('shows battleline badge', () => {
    render(<UnitCard datasheet={baseDatasheet} />)
    expect(screen.getByText('Battleline')).toBeInTheDocument()
  })

  it('shows epic hero badge', () => {
    const epicDs = {
      ...baseDatasheet,
      name: 'Calgar',
      keywords: [{ keyword: 'EPIC HERO', model: '', isFactionKeyword: false }],
    }
    render(<UnitCard datasheet={epicDs} />)
    expect(screen.getByText('Epic Hero')).toBeInTheDocument()
  })

  it('shows no badge for standard', () => {
    const stdDs = {
      ...baseDatasheet,
      name: 'Rhino',
      keywords: [{ keyword: 'TRANSPORT', model: '', isFactionKeyword: false }],
    }
    render(<UnitCard datasheet={stdDs} />)
    expect(screen.queryByText('Battleline')).not.toBeInTheDocument()
    expect(screen.queryByText('Epic Hero')).not.toBeInTheDocument()
  })

  it('shows owned count when > 0', () => {
    render(<UnitCard datasheet={baseDatasheet} owned={3} />)
    expect(screen.getByText('x3')).toBeInTheDocument()
  })

  it('calls onClick when tapped', async () => {
    const handleClick = vi.fn()
    render(<UnitCard datasheet={baseDatasheet} onClick={handleClick} />)
    await userEvent.click(screen.getByText('Intercessor Squad'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
