import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollectionToggle } from './CollectionToggle'

describe('CollectionToggle', () => {
  it('renders two options', () => {
    render(<CollectionToggle value="owned" onChange={() => {}} />)
    expect(screen.getByText('Ma collection')).toBeInTheDocument()
    expect(screen.getByText('Tout')).toBeInTheDocument()
  })

  it('marks owned as active', () => {
    render(<CollectionToggle value="owned" onChange={() => {}} />)
    expect(screen.getByText('Ma collection').closest('button')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Tout').closest('button')).toHaveAttribute('aria-checked', 'false')
  })

  it('marks all as active', () => {
    render(<CollectionToggle value="all" onChange={() => {}} />)
    expect(screen.getByText('Tout').closest('button')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Ma collection').closest('button')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when clicking the other option', async () => {
    const handleChange = vi.fn()
    render(<CollectionToggle value="owned" onChange={handleChange} />)
    await userEvent.click(screen.getByText('Tout'))
    expect(handleChange).toHaveBeenCalledWith('all')
  })
})
