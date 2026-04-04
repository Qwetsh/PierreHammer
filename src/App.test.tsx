import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the bottom navigation', async () => {
    render(<App />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders Collection page by default', async () => {
    render(<App />)
    expect(await screen.findByText('Collection', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
