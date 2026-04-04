import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FactionPicker } from './FactionPicker'
import type { FactionSummary } from '@/types/gameData.types'

const mockFactions: FactionSummary[] = [
  { id: 'SM', name: 'Space Marines', slug: 'space-marines', datasheetCount: 42 },
  { id: 'ORK', name: 'Orks', slug: 'orks', datasheetCount: 30 },
]

describe('FactionPicker', () => {
  it('renders all factions', () => {
    render(<FactionPicker factions={mockFactions} onSelect={() => {}} />)
    expect(screen.getByText('Space Marines')).toBeInTheDocument()
    expect(screen.getByText('Orks')).toBeInTheDocument()
  })

  it('shows datasheet count', () => {
    render(<FactionPicker factions={mockFactions} onSelect={() => {}} />)
    expect(screen.getByText('42 unités')).toBeInTheDocument()
    expect(screen.getByText('30 unités')).toBeInTheDocument()
  })

  it('calls onSelect with slug when clicked', async () => {
    const handleSelect = vi.fn()
    render(<FactionPicker factions={mockFactions} onSelect={handleSelect} />)
    await userEvent.click(screen.getByText('Orks'))
    expect(handleSelect).toHaveBeenCalledWith('orks')
  })
})
