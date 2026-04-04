import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Aucune unité" description="Commencez par explorer le catalogue" />)
    expect(screen.getByText('Aucune unité')).toBeInTheDocument()
    expect(screen.getByText('Commencez par explorer le catalogue')).toBeInTheDocument()
  })

  it('renders CTA button when actionLabel and onAction are provided', () => {
    render(
      <EmptyState
        title="Vide"
        description="Rien ici"
        actionLabel="Explorer"
        onAction={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: 'Explorer' })).toBeInTheDocument()
  })

  it('does not render CTA when actionLabel is missing', () => {
    render(<EmptyState title="Vide" description="Rien ici" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when CTA is clicked', async () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title="Vide"
        description="Rien"
        actionLabel="Ajouter"
        onAction={handleAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(handleAction).toHaveBeenCalledOnce()
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState
        icon={<span data-testid="test-icon">📦</span>}
        title="Vide"
        description="Rien"
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })
})
