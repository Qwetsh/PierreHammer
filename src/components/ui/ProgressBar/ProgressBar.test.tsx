import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('renders simple variant with correct aria attributes', () => {
    render(<ProgressBar value={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
  })

  it('clamps value to 0-100 range', () => {
    const { container } = render(<ProgressBar value={150} />)
    const inner = container.querySelector('[role="progressbar"] > div')
    expect(inner?.getAttribute('style')).toContain('width: 100%')
  })

  it('renders segmented variant with segments', () => {
    const segments = [
      { value: 2, color: 'gray', label: 'Non montée' },
      { value: 3, color: 'blue', label: 'Montée' },
      { value: 1, color: 'orange', label: 'En cours' },
      { value: 4, color: 'green', label: 'Terminée' },
    ]
    render(<ProgressBar variant="segmented" segments={segments} value={40} />)
    expect(screen.getByText('Non montée: 2')).toBeInTheDocument()
    expect(screen.getByText('Montée: 3')).toBeInTheDocument()
    expect(screen.getByText('En cours: 1')).toBeInTheDocument()
    expect(screen.getByText('Terminée: 4')).toBeInTheDocument()
  })

  it('renders progressbar role in segmented variant', () => {
    const segments = [{ value: 5, color: 'green', label: 'Done' }]
    render(<ProgressBar variant="segmented" segments={segments} value={100} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
