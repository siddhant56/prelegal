import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('Login page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    mockPush.mockClear()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('renders the Prelegal brand', () => {
    render(<LoginPage />)
    expect(screen.getByText('Prelegal')).toBeInTheDocument()
  })

  it('renders a "Welcome back" heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
  })

  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders a Sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('navigates to /create on form submit', () => {
    render(<LoginPage />)
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    expect(mockPush).toHaveBeenCalledWith('/create')
  })
})
