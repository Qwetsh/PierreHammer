import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Chercher une unité" />)
    expect(screen.getByPlaceholderText('Chercher une unité')).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn()
    render(<SearchBar value="" onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'space')
    expect(handleChange).toHaveBeenCalled()
  })

  it('shows clear button when value is not empty', () => {
    render(<SearchBar value="test" onChange={() => {}} />)
    expect(screen.getByLabelText('Effacer la recherche')).toBeInTheDocument()
  })

  it('hides clear button when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.queryByLabelText('Effacer la recherche')).not.toBeInTheDocument()
  })

  it('calls onChange with empty string when clear is clicked', async () => {
    const handleChange = vi.fn()
    render(<SearchBar value="test" onChange={handleChange} />)
    await userEvent.click(screen.getByLabelText('Effacer la recherche'))
    expect(handleChange).toHaveBeenCalledWith('')
  })
})
