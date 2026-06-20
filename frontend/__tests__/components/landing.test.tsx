import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Login page', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockFetch.mockReset()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('renders the Prelegal brand', () => {
    render(<LoginPage />)
    expect(screen.getByText('Prelegal')).toBeInTheDocument()
  })

  it('renders a "Welcome back" heading in sign-in mode', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
  })

  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('renders a Sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls /api/auth/login and navigates to /documents on sign-in', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, email: 'test@test.com' }),
    } as Response)

    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email address/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
      expect(mockPush).toHaveBeenCalledWith('/documents')
    })
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email or password' }),
    } as Response)

    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email address/i), 'bad@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('toggles to sign-up mode when "Sign up" link is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create account')
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match in sign-up mode', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await user.type(screen.getByLabelText(/email address/i), 'new@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different456')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('calls /api/auth/register and navigates to /documents on sign-up', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2, email: 'new@test.com' }),
    } as Response)

    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await user.type(screen.getByLabelText(/email address/i), 'new@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'securepass1')
    await user.type(screen.getByLabelText(/confirm password/i), 'securepass1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }))
      expect(mockPush).toHaveBeenCalledWith('/documents')
    })
  })
})
