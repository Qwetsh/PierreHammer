import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the bottom navigation', async () => {
    render(<App />)
    expect(screen.getAllByRole('tablist').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Collection page by default', async () => {
    render(<App />)
    const matches = await screen.findAllByText('Collection', {}, { timeout: 3000 })
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
