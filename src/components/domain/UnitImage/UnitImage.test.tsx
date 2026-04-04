import { render, screen, fireEvent } from '@testing-library/react'
import { UnitImage } from './UnitImage'

describe('UnitImage', () => {
  it('renders placeholder when no src', () => {
    render(<UnitImage alt="Test unit" />)
    expect(screen.getByRole('img', { name: 'Test unit' })).toBeInTheDocument()
  })

  it('renders image when src provided', () => {
    render(<UnitImage src="https://example.com/img.png" alt="Test unit" />)
    const img = screen.getByAltText('Test unit')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  it('shows placeholder on image error', () => {
    render(<UnitImage src="https://example.com/broken.png" alt="Broken" />)
    const img = screen.getByAltText('Broken')
    fireEvent.error(img)
    // After error, should show placeholder
    expect(screen.getByRole('img', { name: 'Broken' })).toBeInTheDocument()
  })

  it('applies size sm by default', () => {
    render(<UnitImage alt="Small" />)
    const el = screen.getByRole('img', { name: 'Small' })
    expect(el.style.width).toBe('48px')
  })

  it('applies size lg', () => {
    render(<UnitImage alt="Large" size="lg" />)
    const el = screen.getByRole('img', { name: 'Large' })
    expect(el.style.width).toBe('120px')
  })
})
