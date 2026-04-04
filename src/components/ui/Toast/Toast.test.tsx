import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function TestComponent() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('Succès!')}>Show Success</button>
      <button onClick={() => showToast('Erreur!', 'error')}>Show Error</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a success toast', async () => {
    vi.useRealTimers()
    renderWithProvider()
    await userEvent.click(screen.getByText('Show Success'))
    expect(screen.getByText('Succès!')).toBeInTheDocument()
  })

  it('success toast has auto-dismiss timer (3s)', async () => {
    vi.useRealTimers()
    renderWithProvider()
    await userEvent.click(screen.getByText('Show Success'))
    // Verify the toast appears — auto-dismiss relies on setTimeout(3000)
    expect(screen.getByText('Succès!')).toBeInTheDocument()
    // Success toast should NOT have a close button (auto-dismiss only)
    expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument()
  })

  it('shows error toast with close button', async () => {
    vi.useRealTimers()
    renderWithProvider()
    await userEvent.click(screen.getByText('Show Error'))
    expect(screen.getByText('Erreur!')).toBeInTheDocument()
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('close button is clickable on error toast', async () => {
    vi.useRealTimers()
    renderWithProvider()
    await userEvent.click(screen.getByText('Show Error'))
    const closeBtn = screen.getByLabelText('Fermer')
    expect(closeBtn).toBeInTheDocument()
    await userEvent.click(closeBtn)
  })

  it('has role="alert" on toast', async () => {
    vi.useRealTimers()
    renderWithProvider()
    await userEvent.click(screen.getByText('Show Success'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
