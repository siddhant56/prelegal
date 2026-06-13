'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NDAFormData, SESSION_KEY } from '@/lib/nda'

const today = new Date().toISOString().split('T')[0]

const empty: NDAFormData = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: today,
  mndaTermType: 'expires',
  mndaTermYears: '1',
  confidentialityTermType: 'years',
  confidentialityTermYears: '1',
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1Name: '',
  party1Title: '',
  party1Company: '',
  party1Address: '',
  party2Name: '',
  party2Title: '',
  party2Company: '',
  party2Address: '',
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none"
    />
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">
      {children}
    </h2>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const [form, setForm] = useState<NDAFormData>(empty)

  function set(field: keyof NDAFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(form))
    router.push('/preview')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Create Mutual NDA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below. All fields marked with * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Agreement Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <SectionHeading>Agreement Details</SectionHeading>

            <div>
              <Label>Purpose *</Label>
              <Textarea
                value={form.purpose}
                onChange={(v) => set('purpose', v)}
                placeholder="Evaluating whether to enter into a business relationship with the other party."
                rows={2}
              />
              <p className="text-xs text-slate-400 mt-1">
                How Confidential Information may be used
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Effective Date *</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(v) => set('effectiveDate', v)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>MNDA Term *</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.mndaTermType === 'expires'}
                    onChange={() => set('mndaTermType', 'expires')}
                    className="accent-slate-700"
                  />
                  <span className="text-sm text-slate-700">Expires after</span>
                  <input
                    type="number"
                    min="1"
                    value={form.mndaTermYears}
                    onChange={(e) => set('mndaTermYears', e.target.value)}
                    disabled={form.mndaTermType !== 'expires'}
                    className="w-16 border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-700">year(s) from Effective Date</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.mndaTermType === 'until_terminated'}
                    onChange={() => set('mndaTermType', 'until_terminated')}
                    className="accent-slate-700"
                  />
                  <span className="text-sm text-slate-700">Continues until terminated</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Term of Confidentiality *</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.confidentialityTermType === 'years'}
                    onChange={() => set('confidentialityTermType', 'years')}
                    className="accent-slate-700"
                  />
                  <input
                    type="number"
                    min="1"
                    value={form.confidentialityTermYears}
                    onChange={(e) => set('confidentialityTermYears', e.target.value)}
                    disabled={form.confidentialityTermType !== 'years'}
                    className="w-16 border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-700">
                    year(s) from Effective Date (trade secrets protected until no longer a trade secret)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.confidentialityTermType === 'perpetuity'}
                    onChange={() => set('confidentialityTermType', 'perpetuity')}
                    className="accent-slate-700"
                  />
                  <span className="text-sm text-slate-700">In perpetuity</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Governing Law *</Label>
                <Input
                  value={form.governingLaw}
                  onChange={(v) => set('governingLaw', v)}
                  placeholder="e.g. Delaware"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">State</p>
              </div>
              <div>
                <Label>Jurisdiction *</Label>
                <Input
                  value={form.jurisdiction}
                  onChange={(v) => set('jurisdiction', v)}
                  placeholder="e.g. New Castle, Delaware"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">City/county and state</p>
              </div>
            </div>

            <div>
              <Label>MNDA Modifications</Label>
              <Textarea
                value={form.modifications}
                onChange={(v) => set('modifications', v)}
                placeholder="List any modifications to the standard terms (optional)"
                rows={2}
              />
            </div>
          </div>

          {/* Party 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <SectionHeading>Party 1</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Print Name *</Label>
                <Input
                  value={form.party1Name}
                  onChange={(v) => set('party1Name', v)}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.party1Title}
                  onChange={(v) => set('party1Title', v)}
                  placeholder="CEO"
                  required
                />
              </div>
              <div>
                <Label>Company *</Label>
                <Input
                  value={form.party1Company}
                  onChange={(v) => set('party1Company', v)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <Label>Notice Address *</Label>
                <Input
                  value={form.party1Address}
                  onChange={(v) => set('party1Address', v)}
                  placeholder="jane@acme.com or 123 Main St"
                  required
                />
              </div>
            </div>
          </div>

          {/* Party 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <SectionHeading>Party 2</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Print Name *</Label>
                <Input
                  value={form.party2Name}
                  onChange={(v) => set('party2Name', v)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.party2Title}
                  onChange={(v) => set('party2Title', v)}
                  placeholder="CTO"
                  required
                />
              </div>
              <div>
                <Label>Company *</Label>
                <Input
                  value={form.party2Company}
                  onChange={(v) => set('party2Company', v)}
                  placeholder="Beta Inc"
                  required
                />
              </div>
              <div>
                <Label>Notice Address *</Label>
                <Input
                  value={form.party2Address}
                  onChange={(v) => set('party2Address', v)}
                  placeholder="john@beta.com or 456 Oak Ave"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-slate-900 text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Preview NDA →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
