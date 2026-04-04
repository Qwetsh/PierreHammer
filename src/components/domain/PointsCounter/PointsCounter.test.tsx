import { render, screen } from '@testing-library/react'
import { PointsCounter } from './PointsCounter'

describe('PointsCounter', () => {
  it('renders current/limit format', () => {
    render(<PointsCounter current={500} limit={2000} />)
    expect(screen.getByText('500/2000 pts')).toBeInTheDocument()
  })

  it('uses success color when under 90%', () => {
    render(<PointsCounter current={1000} limit={2000} />)
    const el = screen.getByText('1000/2000 pts')
    expect(el.style.color).toBe('var(--color-success)')
  })

  it('uses warning color when over 90%', () => {
    render(<PointsCounter current={1850} limit={2000} />)
    const el = screen.getByText('1850/2000 pts')
    expect(el.style.color).toBe('var(--color-warning)')
  })

  it('uses error color when over limit', () => {
    render(<PointsCounter current={2100} limit={2000} />)
    const el = screen.getByText('2100/2000 pts')
    expect(el.style.color).toBe('var(--color-error)')
  })

  it('has aria-live attribute', () => {
    render(<PointsCounter current={0} limit={1000} />)
    expect(screen.getByText('0/1000 pts')).toHaveAttribute('aria-live', 'polite')
  })

  it('uses mono font', () => {
    render(<PointsCounter current={100} limit={1000} />)
    expect(screen.getByText('100/1000 pts').style.fontFamily).toBe('var(--font-mono)')
  })
})
