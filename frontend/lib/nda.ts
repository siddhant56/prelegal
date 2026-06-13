export interface NDAFormData {
  purpose: string
  effectiveDate: string
  mndaTermType: 'expires' | 'until_terminated'
  mndaTermYears: string
  confidentialityTermType: 'years' | 'perpetuity'
  confidentialityTermYears: string
  governingLaw: string
  jurisdiction: string
  modifications: string
  party1Name: string
  party1Title: string
  party1Company: string
  party1Address: string
  party2Name: string
  party2Title: string
  party2Company: string
  party2Address: string
}

export const SESSION_KEY = 'prelegal_nda_draft'

export function formatMndaTerm(data: NDAFormData): string {
  if (data.mndaTermType === 'until_terminated') {
    return 'Continues until terminated in accordance with the terms of the MNDA'
  }
  const years = data.mndaTermYears || '1'
  return `Expires ${years} year${years === '1' ? '' : 's'} from Effective Date`
}

export function formatConfidentialityTerm(data: NDAFormData): string {
  if (data.confidentialityTermType === 'perpetuity') {
    return 'In perpetuity'
  }
  const years = data.confidentialityTermYears || '1'
  return `${years} year${years === '1' ? '' : 's'} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
