import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaintStatusBadge } from './PaintStatusBadge'

describe('PaintStatusBadge', () => {
  it('renders dot mode with symbol', () => {
    render(<PaintStatusBadge status="done" />)
    expect(screen.getByLabelText('Terminée')).toBeInTheDocument()
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('renders full mode with label', () => {
    render(<PaintStatusBadge status="assembled" size="full" />)
    expect(screen.getByText('Montée')).toBeInTheDocument()
    expect(screen.getByText('◐')).toBeInTheDocument()
  })

  it('calls onCycle when clicked', async () => {
    const handleCycle = vi.fn()
    render(<PaintStatusBadge status="unassembled" onCycle={handleCycle} />)
    await userEvent.click(screen.getByLabelText('Non montée'))
    expect(handleCycle).toHaveBeenCalledOnce()
  })

  it('is disabled when no onCycle', () => {
    render(<PaintStatusBadge status="in-progress" />)
    expect(screen.getByLabelText('En cours')).toBeDisabled()
  })
})
