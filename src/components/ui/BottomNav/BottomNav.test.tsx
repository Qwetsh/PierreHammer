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
  it('renders 5 tabs per nav (mobile + desktop)', () => {
    renderWithRouter()
    const tabs = screen.getAllByRole('tab')
    // 5 tabs in mobile nav + 5 tabs in desktop sidebar = 10
    expect(tabs).toHaveLength(10)
  })

  it('renders tab labels', () => {
    renderWithRouter()
    // Each label appears twice (mobile + desktop)
    expect(screen.getAllByText('Collection')).toHaveLength(2)
    expect(screen.getAllByText('Mes Listes')).toHaveLength(2)
    expect(screen.getAllByText('Catalogue')).toHaveLength(2)
    expect(screen.getAllByText('Calcul')).toHaveLength(2)
    expect(screen.getAllByText('Profil')).toHaveLength(2)
  })

  it('has role="tablist" on nav elements', () => {
    renderWithRouter()
    const tablists = screen.getAllByRole('tablist')
    expect(tablists).toHaveLength(2)
  })

  it('highlights the active tab', () => {
    renderWithRouter(['/catalog'])
    const catalogTabs = screen.getAllByText('Catalogue').map((el) => el.closest('a'))
    // Both mobile and desktop should highlight active tab
    catalogTabs.forEach((tab) => {
      expect(tab).toHaveStyle({ color: 'var(--color-accent)' })
    })
  })
})
