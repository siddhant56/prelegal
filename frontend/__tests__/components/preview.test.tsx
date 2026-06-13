import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PreviewPage from '@/app/preview/page'
import { SESSION_KEY, NDAFormData } from '@/lib/nda'

const mockReplace = jest.fn()
const stableRouter = { replace: mockReplace }

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Imported after jest.mock hoisting so the mock is already in place
const { useRouter } = jest.requireMock('next/navigation') as { useRouter: jest.Mock }

const sampleData: NDAFormData = {
  purpose: 'Evaluating a potential joint venture',
  effectiveDate: '2025-06-01',
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

beforeEach(() => {
  useRouter.mockReturnValue(stableRouter)
  mockReplace.mockClear()
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sampleData))
})

afterEach(() => {
  sessionStorage.clear()
})

// ─── Redirect behaviour ────────────────────────────────────────────────────

describe('PreviewPage — redirect', () => {
  it('redirects to /create when sessionStorage is empty', () => {
    sessionStorage.clear()
    render(<PreviewPage />)
    expect(mockReplace).toHaveBeenCalledWith('/create')
  })

  it('does not redirect when sessionStorage has data', () => {
    render(<PreviewPage />)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

// ─── Cover page content ────────────────────────────────────────────────────

describe('PreviewPage — cover page', () => {
  it('renders the document title', () => {
    render(<PreviewPage />)
    expect(
      screen.getByRole('heading', { name: /mutual non-disclosure agreement/i })
    ).toBeInTheDocument()
  })

  it('renders the purpose from sessionStorage', () => {
    render(<PreviewPage />)
    // Purpose appears in cover page table AND inline in standard terms
    expect(screen.getAllByText(/evaluating a potential joint venture/i).length).toBeGreaterThan(0)
  })

  it('renders the formatted effective date', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText(/june 1, 2025/i).length).toBeGreaterThan(0)
  })

  it('renders the MNDA term', () => {
    render(<PreviewPage />)
    // Appears in cover page table and in section 5 of standard terms
    expect(screen.getAllByText(/expires 2 years from effective date/i).length).toBeGreaterThan(0)
  })

  it('renders the confidentiality term with trade-secret carve-out', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText(/3 years from effective date/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/trade secret/i).length).toBeGreaterThan(0)
  })

  it('renders the governing law', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText('Delaware').length).toBeGreaterThan(0)
  })

  it('renders jurisdiction', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText(/new castle, delaware/i).length).toBeGreaterThan(0)
  })

  it('renders Party 1 name in the signature table', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0)
  })

  it('renders Party 2 name in the signature table', () => {
    render(<PreviewPage />)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
  })

  it('renders Party 1 company', () => {
    render(<PreviewPage />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders Party 2 company', () => {
    render(<PreviewPage />)
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('renders MNDA Modifications row only when modifications are present', () => {
    const dataWithMods: NDAFormData = { ...sampleData, modifications: 'Section 4 is waived.' }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(dataWithMods))
    render(<PreviewPage />)
    expect(screen.getByText('MNDA Modifications')).toBeInTheDocument()
    expect(screen.getByText('Section 4 is waived.')).toBeInTheDocument()
  })

  it('does not render MNDA Modifications row when empty', () => {
    render(<PreviewPage />)
    expect(screen.queryByText('MNDA Modifications')).not.toBeInTheDocument()
  })
})

// ─── Standard terms content ────────────────────────────────────────────────

describe('PreviewPage — standard terms', () => {
  it('renders the Standard Terms heading', () => {
    render(<PreviewPage />)
    expect(screen.getByRole('heading', { name: /standard terms/i })).toBeInTheDocument()
  })

  it('renders section 1 Introduction', () => {
    render(<PreviewPage />)
    expect(screen.getByText(/1\. Introduction\./i)).toBeInTheDocument()
  })

  it('renders section 5 Term and Termination', () => {
    render(<PreviewPage />)
    expect(screen.getByText(/5\. Term and Termination\./i)).toBeInTheDocument()
  })

  it('renders section 9 Governing Law and Jurisdiction', () => {
    render(<PreviewPage />)
    expect(screen.getByText(/9\. Governing Law and Jurisdiction\./i)).toBeInTheDocument()
  })

  it('renders all 11 sections', () => {
    render(<PreviewPage />)
    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(new RegExp(`^${i}\\.`))).toBeInTheDocument()
    }
  })

  it('inlines the purpose value in standard terms text', () => {
    render(<PreviewPage />)
    // The purpose appears as a highlighted span in section 1 and 2
    const highlights = screen.getAllByTitle('Purpose')
    expect(highlights.length).toBeGreaterThan(0)
    expect(highlights[0]).toHaveTextContent('Evaluating a potential joint venture')
  })

  it('inlines the governing law in section 9', () => {
    render(<PreviewPage />)
    const highlights = screen.getAllByTitle('Governing Law')
    expect(highlights.length).toBeGreaterThan(0)
  })
})

// ─── Toolbar ───────────────────────────────────────────────────────────────

describe('PreviewPage — toolbar', () => {
  it('renders the Download PDF button', () => {
    render(<PreviewPage />)
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
  })

  it('renders the Edit back link pointing to /create', () => {
    render(<PreviewPage />)
    const link = screen.getByRole('link', { name: /edit/i })
    expect(link).toHaveAttribute('href', '/create')
  })

  it('calls window.print when Download PDF is clicked', async () => {
    const user = userEvent.setup()
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
    render(<PreviewPage />)
    await user.click(screen.getByRole('button', { name: /download pdf/i }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
  })
})

// ─── "Until terminated" term variant ──────────────────────────────────────

describe('PreviewPage — until_terminated term', () => {
  it('renders the "until terminated" MNDA term', () => {
    const data: NDAFormData = { ...sampleData, mndaTermType: 'until_terminated' }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    render(<PreviewPage />)
    expect(
      screen.getAllByText(/continues until terminated in accordance with the terms/i).length
    ).toBeGreaterThan(0)
  })
})

// ─── Perpetuity confidentiality term variant ──────────────────────────────

describe('PreviewPage — perpetuity confidentiality', () => {
  it('renders "In perpetuity" for perpetuity term', () => {
    const data: NDAFormData = { ...sampleData, confidentialityTermType: 'perpetuity' }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    render(<PreviewPage />)
    expect(screen.getAllByText('In perpetuity').length).toBeGreaterThan(0)
  })
})
