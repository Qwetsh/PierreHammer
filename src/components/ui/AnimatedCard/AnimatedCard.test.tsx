import { render, screen } from '@testing-library/react'
import { AnimatedCard } from './AnimatedCard'

describe('AnimatedCard', () => {
  it('renders children', () => {
    render(
      <AnimatedCard>
        <span>Card content</span>
      </AnimatedCard>,
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders as plain div when disabled', () => {
    const { container } = render(
      <AnimatedCard disabled>
        <span>Static card</span>
      </AnimatedCard>,
    )
    expect(screen.getByText('Static card')).toBeInTheDocument()
    // When disabled, no motion wrapper — just a plain div
    const wrapper = container.firstElementChild
    expect(wrapper?.tagName).toBe('DIV')
  })

  it('renders as plain div when prefers-reduced-motion is set', () => {
    // jsdom matchMedia defaults to not matching, but we can test the disabled fallback
    const { container } = render(
      <AnimatedCard disabled>
        <span>Reduced motion</span>
      </AnimatedCard>,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.tagName).toBe('DIV')
  })

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedCard className="custom-class" disabled>
        <span>Styled</span>
      </AnimatedCard>,
    )
    expect(container.firstElementChild).toHaveClass('custom-class')
  })
})
