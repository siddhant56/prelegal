import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Suspense } from 'react'
import CreateClient from '@/app/create/[docType]/create-client'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: () => null }),
}))

// Mock auth — always authenticated
jest.mock('@/lib/auth', () => ({
  useRequireAuth: () => ({ user: { id: 1, email: 'test@example.com' }, loading: false }),
  logout: jest.fn(),
}))

function renderCreate(docType = 'mutual-nda') {
  return render(
    <Suspense fallback={null}>
      <CreateClient docType={docType} />
    </Suspense>
  )
}

function mockChatSuccess(message: string, fields: Record<string, string | null> = {}, is_complete = false) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ message, fields, is_complete }),
  } as Response)
}

beforeEach(() => {
  mockPush.mockClear()
  mockFetch.mockReset()
  sessionStorage.clear()
})

// ── Rendering ────────────────────────────────────────────────────────────────

describe('CreateClient — rendering', () => {
  it('renders the chat mode by default', () => {
    renderCreate()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('renders the document name in header', () => {
    renderCreate()
    expect(screen.getAllByText(/Mutual NDA/i).length).toBeGreaterThan(0)
  })

  it('renders Chat and Form toggle buttons', () => {
    renderCreate()
    expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^form$/i })).toBeInTheDocument()
  })

  it('renders Preview NDA button disabled initially', () => {
    renderCreate()
    expect(screen.getByRole('button', { name: /preview nda/i })).toBeDisabled()
  })

  it('renders the Documents back link', () => {
    renderCreate()
    expect(screen.getByText(/← Documents/i)).toBeInTheDocument()
  })

  it('shows unknown doc type message for invalid docType', () => {
    renderCreate('not-a-real-type')
    expect(screen.getByText(/Unknown document type/i)).toBeInTheDocument()
  })
})

// ── Chat interaction ──────────────────────────────────────────────────────────

describe('CreateClient — chat mode', () => {
  it('sends message and shows AI response', async () => {
    const user = userEvent.setup()
    mockChatSuccess('Great! What parties are involved?')
    renderCreate()

    await user.type(screen.getByRole('textbox'), 'We need a partnership NDA')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Great! What parties are involved?')).toBeInTheDocument()
    })
  })

  it('calls /api/document/chat with correct doc_type', async () => {
    const user = userEvent.setup()
    mockChatSuccess('Response')
    renderCreate('sla')

    await user.type(screen.getByRole('textbox'), 'hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.doc_type).toBe('sla')
  })

  it('shows error message when fetch fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    renderCreate()

    await user.type(screen.getByRole('textbox'), 'hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('sends on Enter, does not send on Shift+Enter', async () => {
    const user = userEvent.setup()
    mockChatSuccess('Response')
    renderCreate()

    const input = screen.getByRole('textbox')
    await user.type(input, 'hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(mockFetch).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
  })
})

// ── Mode toggle ───────────────────────────────────────────────────────────────

describe('CreateClient — form mode', () => {
  it('switches to form mode and shows AI Assist button', async () => {
    const user = userEvent.setup()
    renderCreate()
    await user.click(screen.getByRole('button', { name: /^form$/i }))
    expect(screen.getByRole('button', { name: /ai assist/i })).toBeInTheDocument()
  })

  it('hides chat input in form mode', async () => {
    const user = userEvent.setup()
    renderCreate()
    await user.click(screen.getByRole('button', { name: /^form$/i }))
    expect(screen.queryByRole('button', { name: /^send$/i })).not.toBeInTheDocument()
  })
})

// ── Preview / document save ───────────────────────────────────────────────────

describe('CreateClient — preview', () => {
  it('writes to sessionStorage and saves to backend on preview', async () => {
    // Fill all NDA fields via chat response
    const allFields = {
      purpose: 'Partnership evaluation', effectiveDate: '2026-01-01',
      mndaTermType: 'expires', mndaTermYears: '2',
      confidentialityTermType: 'years', confidentialityTermYears: '3',
      governingLaw: 'Delaware', jurisdiction: 'New Castle, Delaware',
      modifications: 'None',
      party1Name: 'Jane', party1Title: 'CEO', party1Company: 'Acme', party1Address: 'jane@acme.com',
      party2Name: 'John', party2Title: 'CTO', party2Company: 'Beta', party2Address: 'john@beta.com',
    }
    const user = userEvent.setup()
    mockChatSuccess('Done!', allFields, false)
    // Mock the save POST
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 42 }) } as Response)

    renderCreate()
    await user.type(screen.getByRole('textbox'), 'Confirmed')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preview nda/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /preview nda/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/preview/mutual-nda'))
    })
  })
})
