import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatePage from '@/app/create/page'
import { SESSION_KEY } from '@/lib/nda'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  mockPush.mockClear()
  sessionStorage.clear()
})

// ─── Rendering ────────────────────────────────────────────────────────────

describe('CreatePage — rendering', () => {
  it('renders the page heading', () => {
    render(<CreatePage />)
    expect(screen.getByRole('heading', { name: /create mutual nda/i })).toBeInTheDocument()
  })

  it('renders the Agreement Details section', () => {
    render(<CreatePage />)
    expect(screen.getByText('Agreement Details')).toBeInTheDocument()
  })

  it('renders Party 1 and Party 2 sections', () => {
    render(<CreatePage />)
    expect(screen.getByText('Party 1')).toBeInTheDocument()
    expect(screen.getByText('Party 2')).toBeInTheDocument()
  })

  it('pre-fills the purpose textarea with default text', () => {
    render(<CreatePage />)
    const textarea = screen.getByPlaceholderText(/evaluating whether/i)
    expect(textarea).toHaveValue(
      'Evaluating whether to enter into a business relationship with the other party.'
    )
  })

  it('renders the "expires" radio selected by default', () => {
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    // First radio is "expires" MNDA term
    expect(radios[0]).toBeChecked()
    // Second radio is "until_terminated"
    expect(radios[1]).not.toBeChecked()
  })

  it('renders the "years" confidentiality radio selected by default', () => {
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    // Third radio is confidentiality "years"
    expect(radios[2]).toBeChecked()
    // Fourth radio is "perpetuity"
    expect(radios[3]).not.toBeChecked()
  })

  it('renders the Preview NDA submit button', () => {
    render(<CreatePage />)
    expect(screen.getByRole('button', { name: /preview nda/i })).toBeInTheDocument()
  })

  it('renders a Back link to /', () => {
    render(<CreatePage />)
    const back = screen.getByRole('link', { name: /back/i })
    expect(back).toHaveAttribute('href', '/')
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────

describe('CreatePage — interactions', () => {
  it('updates the purpose field when user types', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const textarea = screen.getByPlaceholderText(/evaluating whether/i)
    await user.clear(textarea)
    await user.type(textarea, 'Exploring a joint venture')
    expect(textarea).toHaveValue('Exploring a joint venture')
  })

  it('switches MNDA term to "until terminated" when radio clicked', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1]) // "until_terminated"
    expect(radios[1]).toBeChecked()
    expect(radios[0]).not.toBeChecked()
  })

  it('disables the MNDA term year input when "until terminated" is selected', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1]) // "until_terminated"
    // The year spinbutton for MNDA term should now be disabled
    const spinbuttons = screen.getAllByRole('spinbutton')
    expect(spinbuttons[0]).toBeDisabled()
  })

  it('disables the confidentiality year input when "perpetuity" is selected', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[3]) // perpetuity
    const spinbuttons = screen.getAllByRole('spinbutton')
    expect(spinbuttons[1]).toBeDisabled()
  })

  it('updates Governing Law when user types', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const input = screen.getByPlaceholderText(/e\.g\. delaware/i)
    await user.type(input, 'California')
    expect(input).toHaveValue('California')
  })
})

// ─── Form submission ───────────────────────────────────────────────────────

describe('CreatePage — form submission', () => {
  function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    return async () => {
      await user.type(screen.getByPlaceholderText(/e\.g\. delaware/i), 'Delaware')
      await user.type(screen.getByPlaceholderText(/e\.g\. new castle/i), 'New Castle, Delaware')
      // Party 1
      const [p1Name, p2Name] = screen.getAllByPlaceholderText(/jane smith|john doe/i)
      await user.type(p1Name, 'Jane Smith')
      await user.type(p2Name, 'John Doe')
      const [p1Title, p2Title] = screen.getAllByPlaceholderText(/ceo|cto/i)
      await user.type(p1Title, 'CEO')
      await user.type(p2Title, 'CTO')
      const [p1Company, p2Company] = screen.getAllByPlaceholderText(/acme corp|beta inc/i)
      await user.type(p1Company, 'Acme Corp')
      await user.type(p2Company, 'Beta Inc')
      const [p1Addr, p2Addr] = screen.getAllByPlaceholderText(/jane@acme|john@beta/i)
      await user.type(p1Addr, 'jane@acme.com')
      await user.type(p2Addr, 'john@beta.com')
    }
  }

  it('saves form data to sessionStorage on submit', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    await fillRequiredFields(user)()
    await user.click(screen.getByRole('button', { name: /preview nda/i }))
    await waitFor(() => {
      const stored = sessionStorage.getItem(SESSION_KEY)
      expect(stored).not.toBeNull()
    })
    const data = JSON.parse(sessionStorage.getItem(SESSION_KEY)!)
    expect(data.governingLaw).toBe('Delaware')
    expect(data.party1Name).toBe('Jane Smith')
    expect(data.party2Name).toBe('John Doe')
  })

  it('navigates to /preview on submit', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    await fillRequiredFields(user)()
    await user.click(screen.getByRole('button', { name: /preview nda/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })
  })

  it('stores the correct mndaTermType in sessionStorage', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    // Switch to "until terminated"
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    await fillRequiredFields(user)()
    await user.click(screen.getByRole('button', { name: /preview nda/i }))
    await waitFor(() => {
      const data = JSON.parse(sessionStorage.getItem(SESSION_KEY)!)
      expect(data.mndaTermType).toBe('until_terminated')
    })
  })

  it('stores perpetuity confidentiality term in sessionStorage', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[3]) // perpetuity
    await fillRequiredFields(user)()
    await user.click(screen.getByRole('button', { name: /preview nda/i }))
    await waitFor(() => {
      const data = JSON.parse(sessionStorage.getItem(SESSION_KEY)!)
      expect(data.confidentialityTermType).toBe('perpetuity')
    })
  })
})
