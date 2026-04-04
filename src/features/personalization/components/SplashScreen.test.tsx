import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplashScreen } from './SplashScreen'
import { usePreferencesStore } from '@/stores/preferencesStore'

describe('SplashScreen', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ hasSeenSplash: false })
  })

  it('shows splash when not seen', () => {
    render(<SplashScreen />)
    expect(screen.getByText('PierreHammer')).toBeInTheDocument()
    expect(screen.getByText(/Salut Pierre/)).toBeInTheDocument()
  })

  it('does not show splash when already seen', () => {
    usePreferencesStore.setState({ hasSeenSplash: true })
    const { container } = render(<SplashScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('dismisses on button click', async () => {
    const user = userEvent.setup()
    render(<SplashScreen />)
    await user.click(screen.getByText('Entrer dans le Warp'))
    expect(usePreferencesStore.getState().hasSeenSplash).toBe(true)
  })
})
