import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BottomNav } from './BottomNav'

function renderWithRouter(initialEntries = ['/collection']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BottomNav />
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  it('renders 4 tabs', () => {
    renderWithRouter()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
  })

  it('renders tab labels', () => {
    renderWithRouter()
    expect(screen.getByText('Collection')).toBeInTheDocument()
    expect(screen.getByText('Mes Listes')).toBeInTheDocument()
    expect(screen.getByText('Catalogue')).toBeInTheDocument()
    expect(screen.getByText('Profil')).toBeInTheDocument()
  })

  it('has role="tablist" on nav element', () => {
    renderWithRouter()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    renderWithRouter(['/catalog'])
    const catalogTab = screen.getByText('Catalogue').closest('a')
    expect(catalogTab).toHaveStyle({ color: 'var(--color-accent)' })
  })
})
