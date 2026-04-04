import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartySwiper } from './PartySwiper'
import type { Datasheet } from '@/types/gameData.types'

const makeDatasheet = (id: string, name: string): Datasheet => ({
  id,
  name,
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
  profiles: [{ name, M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '2', invSv: '', invSvDescr: '' }],
  weapons: [],
  abilities: [],
  pointOptions: [{ cost: 100, models: '5' }],
})

const datasheets = [
  makeDatasheet('ds-1', 'Intercessors'),
  makeDatasheet('ds-2', 'Hellblasters'),
  makeDatasheet('ds-3', 'Aggressors'),
]

describe('PartySwiper', () => {
  it('shows position indicator', () => {
    render(<PartySwiper datasheets={datasheets} onClose={() => {}} />)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('shows quit button', () => {
    render(<PartySwiper datasheets={datasheets} onClose={() => {}} />)
    expect(screen.getByText('Quitter')).toBeInTheDocument()
  })

  it('calls onClose when quit clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PartySwiper datasheets={datasheets} onClose={onClose} />)
    await user.click(screen.getByText('Quitter'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows next arrow but not previous on first slide', () => {
    render(<PartySwiper datasheets={datasheets} onClose={() => {}} />)
    expect(screen.getByLabelText('Unité suivante')).toBeInTheDocument()
    expect(screen.queryByLabelText('Unité précédente')).not.toBeInTheDocument()
  })

  it('navigates to next unit via arrow button', async () => {
    const user = userEvent.setup()
    render(<PartySwiper datasheets={datasheets} onClose={() => {}} />)
    await user.click(screen.getByLabelText('Unité suivante'))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('shows previous arrow after navigating forward', async () => {
    const user = userEvent.setup()
    render(<PartySwiper datasheets={datasheets} onClose={() => {}} />)
    await user.click(screen.getByLabelText('Unité suivante'))
    expect(screen.getByLabelText('Unité précédente')).toBeInTheDocument()
  })

  it('starts at initialIndex', () => {
    render(<PartySwiper datasheets={datasheets} initialIndex={2} onClose={() => {}} />)
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('hides next arrow on last slide', () => {
    render(<PartySwiper datasheets={datasheets} initialIndex={2} onClose={() => {}} />)
    expect(screen.queryByLabelText('Unité suivante')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Unité précédente')).toBeInTheDocument()
  })
})
