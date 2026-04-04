import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppShell } from './AppShell'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AppShell>
        <div>Content</div>
      </AppShell>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  it('renders main element with id', () => {
    renderWithRouter()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('renders skip link', () => {
    renderWithRouter()
    const skipLink = screen.getByText('Aller au contenu principal')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('renders children', () => {
    renderWithRouter()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders BottomNav', () => {
    renderWithRouter()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})
