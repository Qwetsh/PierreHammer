import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { T } from './TranslatableText'
import { useTranslationStore } from '@/stores/translationStore'

describe('TranslatableText', () => {
  beforeEach(() => {
    useTranslationStore.setState({
      translations: {},
      loaded: false,
      editMode: false,
    })
  })

  it('renders original English text when no translation exists', () => {
    render(<T text="Bolt Rifle" category="weapon" />)
    expect(screen.getByText('Bolt Rifle')).toBeInTheDocument()
  })

  it('renders translated text when translation exists', () => {
    useTranslationStore.setState({
      translations: { weapon: { 'Bolt Rifle': 'Fusil Bolter' } },
    })
    render(<T text="Bolt Rifle" category="weapon" />)
    expect(screen.getByText('Fusil Bolter')).toBeInTheDocument()
  })

  it('applies className and style props', () => {
    render(<T text="Bolt Rifle" category="weapon" className="font-bold" style={{ color: 'red' }} />)
    const el = screen.getByText('Bolt Rifle')
    expect(el).toHaveClass('font-bold')
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('shows dashed underline in edit mode for untranslated text', () => {
    useTranslationStore.setState({ editMode: true })
    render(<T text="Bolt Rifle" category="weapon" />)
    const el = screen.getByText('Bolt Rifle')
    expect(el).toHaveStyle({ cursor: 'pointer' })
  })

  it('shows green underline in edit mode for translated text', () => {
    useTranslationStore.setState({
      translations: { weapon: { 'Bolt Rifle': 'Fusil Bolter' } },
      editMode: true,
    })
    render(<T text="Bolt Rifle" category="weapon" />)
    const el = screen.getByText('Fusil Bolter')
    expect(el).toHaveStyle({ cursor: 'pointer' })
  })
})
