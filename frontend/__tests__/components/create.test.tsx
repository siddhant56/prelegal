import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatePage from '@/app/create/page'
import { SESSION_KEY } from '@/lib/nda'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockChatResponse(
  message: string,
  fields: Record<string, string | null> = {},
  is_complete = false
) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      message,
      fields: {
        purpose: null,
        effectiveDate: null,
        mndaTermType: null,
        mndaTermYears: null,
        confidentialityTermType: null,
        confidentialityTermYears: null,
        governingLaw: null,
        jurisdiction: null,
        modifications: null,
        party1Name: null,
        party1Title: null,
        party1Company: null,
        party1Address: null,
        party2Name: null,
        party2Title: null,
        party2Company: null,
        party2Address: null,
        ...fields,
      },
      is_complete,
    }),
  } as Response)
}

beforeEach(() => {
  mockPush.mockClear()
  mockFetch.mockReset()
  sessionStorage.clear()
})

// ─── Rendering ────────────────────────────────────────────────────────────

describe('CreatePage — rendering', () => {
  it('renders the page heading', () => {
    render(<CreatePage />)
    expect(screen.getByText('Create Mutual NDA')).toBeInTheDocument()
  })

  it('renders the opening AI message', () => {
    render(<CreatePage />)
    expect(screen.getByText(/help you draft a mutual nda/i)).toBeInTheDocument()
  })

  it('renders the message input', () => {
    render(<CreatePage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the Send button', () => {
    render(<CreatePage />)
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('renders the NDA Fields panel heading', () => {
    render(<CreatePage />)
    expect(screen.getByText('NDA Fields')).toBeInTheDocument()
  })

  it('renders the Preview NDA button (disabled initially)', () => {
    render(<CreatePage />)
    const btn = screen.getByRole('button', { name: /preview nda/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toBeDisabled()
  })

  it('renders a Back link to /', () => {
    render(<CreatePage />)
    const back = screen.getByRole('link', { name: /back/i })
    expect(back).toHaveAttribute('href', '/')
  })

  it('shows "Not collected" for empty required fields', () => {
    render(<CreatePage />)
    const notCollected = screen.getAllByText('Not collected')
    expect(notCollected.length).toBeGreaterThan(0)
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────

describe('CreatePage — interactions', () => {
  it('updates the input when the user types', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello')
    expect(input).toHaveValue('Hello')
  })

  it('disables Send when input is empty', () => {
    render(<CreatePage />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('enables Send when input has text', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    await user.type(screen.getByRole('textbox'), 'Hello')
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
  })

  it('appends user message to chat when Send is clicked', async () => {
    const user = userEvent.setup()
    mockChatResponse('Got it! What parties are involved?')
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Exploring a partnership')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText('Exploring a partnership')).toBeInTheDocument()
  })

  it('displays AI response after fetch resolves', async () => {
    const user = userEvent.setup()
    mockChatResponse('Great! Who are the two parties?')
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Exploring a partnership')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Great! Who are the two parties?')).toBeInTheDocument()
    })
  })

  it('clears the input after sending', async () => {
    const user = userEvent.setup()
    mockChatResponse('OK')
    render(<CreatePage />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('sends on Enter key', async () => {
    const user = userEvent.setup()
    mockChatResponse('Response')
    render(<CreatePage />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello{Enter}')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls /api/nda/chat with messages array', async () => {
    const user = userEvent.setup()
    mockChatResponse('Response')
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Partnership deal')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/nda/chat')
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body)
    expect(body.messages).toContainEqual({ role: 'user', content: 'Partnership deal' })
  })
})

// ─── Field extraction ──────────────────────────────────────────────────────

describe('CreatePage — field extraction', () => {
  it('updates the fields panel when AI extracts a field', async () => {
    const user = userEvent.setup()
    mockChatResponse('Got it. What state governs the agreement?', {
      purpose: 'Evaluating a partnership',
    })
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'We are exploring a partnership')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Evaluating a partnership')).toBeInTheDocument()
    })
  })

  it('does not update fields when all returned fields are null', async () => {
    const user = userEvent.setup()
    mockChatResponse('Can you tell me more?')
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Hmm')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText("Can you tell me more?")).toBeInTheDocument()
    })
  })
})

// ─── Completion ───────────────────────────────────────────────────────────

describe('CreatePage — completion', () => {
  const allFields = {
    purpose: 'Partnership evaluation',
    effectiveDate: '2025-01-15',
    mndaTermType: 'expires',
    mndaTermYears: '2',
    confidentialityTermType: 'years',
    confidentialityTermYears: '3',
    governingLaw: 'Delaware',
    jurisdiction: 'New Castle, Delaware',
    modifications: '',
    party1Name: 'Jane Smith',
    party1Title: 'CEO',
    party1Company: 'Acme Corp',
    party1Address: 'jane@acme.com',
    party2Name: 'John Doe',
    party2Title: 'CTO',
    party2Company: 'Beta Inc',
    party2Address: 'john@beta.com',
  }

  it('enables the Preview NDA button when is_complete is true', async () => {
    const user = userEvent.setup()
    mockChatResponse('All done! Click Preview NDA.', allFields, true)
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Yes, that is correct')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preview nda/i })).not.toBeDisabled()
    })
  })

  it('disables the chat input when is_complete is true', async () => {
    const user = userEvent.setup()
    mockChatResponse('All done!', allFields, true)
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Confirmed')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  it('saves fields to sessionStorage and navigates to /preview on Preview click', async () => {
    const user = userEvent.setup()
    mockChatResponse('All done!', allFields, true)
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Confirmed')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preview nda/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /preview nda/i }))

    const stored = sessionStorage.getItem(SESSION_KEY)
    expect(stored).not.toBeNull()
    const data = JSON.parse(stored!)
    expect(data.governingLaw).toBe('Delaware')
    expect(data.party1Name).toBe('Jane Smith')
    expect(mockPush).toHaveBeenCalledWith('/preview')
  })
})

// ─── Error handling ───────────────────────────────────────────────────────

describe('CreatePage — error handling', () => {
  it('shows an error message when fetch fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows an error message when fetch returns non-ok response', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    render(<CreatePage />)

    await user.type(screen.getByRole('textbox'), 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
