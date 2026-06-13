import {
  formatDate,
  formatMndaTerm,
  formatConfidentialityTerm,
  NDAFormData,
} from '@/lib/nda'

const base: NDAFormData = {
  purpose: 'Evaluating a potential partnership',
  effectiveDate: '2025-01-15',
  mndaTermType: 'expires',
  mndaTermYears: '1',
  confidentialityTermType: 'years',
  confidentialityTermYears: '1',
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

// ─── formatDate ────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a standard ISO date string', () => {
    expect(formatDate('2025-01-15')).toBe('January 15, 2025')
  })

  it('formats a date at the end of the year', () => {
    expect(formatDate('2025-12-31')).toBe('December 31, 2025')
  })

  it('formats a date at the start of the year', () => {
    expect(formatDate('2025-01-01')).toBe('January 1, 2025')
  })

  it('returns an empty string for an empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('handles a leap day date', () => {
    expect(formatDate('2024-02-29')).toBe('February 29, 2024')
  })
})

// ─── formatMndaTerm ────────────────────────────────────────────────────────

describe('formatMndaTerm', () => {
  it('returns "until terminated" text when type is until_terminated', () => {
    const data: NDAFormData = { ...base, mndaTermType: 'until_terminated', mndaTermYears: '2' }
    expect(formatMndaTerm(data)).toBe(
      'Continues until terminated in accordance with the terms of the MNDA'
    )
  })

  it('uses singular "year" when mndaTermYears is 1', () => {
    const data: NDAFormData = { ...base, mndaTermType: 'expires', mndaTermYears: '1' }
    expect(formatMndaTerm(data)).toBe('Expires 1 year from Effective Date')
  })

  it('uses plural "years" when mndaTermYears is 2', () => {
    const data: NDAFormData = { ...base, mndaTermType: 'expires', mndaTermYears: '2' }
    expect(formatMndaTerm(data)).toBe('Expires 2 years from Effective Date')
  })

  it('uses plural "years" for 3+', () => {
    const data: NDAFormData = { ...base, mndaTermType: 'expires', mndaTermYears: '5' }
    expect(formatMndaTerm(data)).toBe('Expires 5 years from Effective Date')
  })

  it('falls back to 1 year when mndaTermYears is empty', () => {
    const data: NDAFormData = { ...base, mndaTermType: 'expires', mndaTermYears: '' }
    expect(formatMndaTerm(data)).toBe('Expires 1 year from Effective Date')
  })
})

// ─── formatConfidentialityTerm ────────────────────────────────────────────

describe('formatConfidentialityTerm', () => {
  it('returns "In perpetuity" when type is perpetuity', () => {
    const data: NDAFormData = {
      ...base,
      confidentialityTermType: 'perpetuity',
      confidentialityTermYears: '3',
    }
    expect(formatConfidentialityTerm(data)).toBe('In perpetuity')
  })

  it('uses singular "year" when confidentialityTermYears is 1', () => {
    const data: NDAFormData = {
      ...base,
      confidentialityTermType: 'years',
      confidentialityTermYears: '1',
    }
    expect(formatConfidentialityTerm(data)).toContain('1 year from Effective Date')
  })

  it('uses plural "years" when confidentialityTermYears is 2', () => {
    const data: NDAFormData = {
      ...base,
      confidentialityTermType: 'years',
      confidentialityTermYears: '2',
    }
    expect(formatConfidentialityTerm(data)).toContain('2 years from Effective Date')
  })

  it('includes trade-secret carve-out text for year-based term', () => {
    const data: NDAFormData = {
      ...base,
      confidentialityTermType: 'years',
      confidentialityTermYears: '2',
    }
    expect(formatConfidentialityTerm(data)).toContain(
      'until Confidential Information is no longer considered a trade secret'
    )
  })

  it('falls back to 1 year when confidentialityTermYears is empty', () => {
    const data: NDAFormData = {
      ...base,
      confidentialityTermType: 'years',
      confidentialityTermYears: '',
    }
    expect(formatConfidentialityTerm(data)).toContain('1 year from Effective Date')
  })
})
