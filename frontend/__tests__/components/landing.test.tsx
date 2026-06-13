import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Landing page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mutual NDA Creator')
  })

  it('renders the Create NDA link pointing to /create', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /create nda/i })
    expect(link).toHaveAttribute('href', '/create')
  })

  it('renders the Common Paper attribution link', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /common paper mutual nda v1\.0/i })
    expect(link).toBeInTheDocument()
  })

  it('renders the Prelegal label', () => {
    render(<Home />)
    expect(screen.getByText('Prelegal')).toBeInTheDocument()
  })
})
