'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NDAFormData, SESSION_KEY } from '@/lib/nda'

const today = new Date().toISOString().split('T')[0]

const defaultFields: NDAFormData = {
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

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const OPENING_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'll help you draft a Mutual NDA. Let's start — what's the purpose of this agreement? For example, are you exploring a business partnership, vendor relationship, or investment discussion?",
}

const fieldGroups = [
  {
    label: 'Agreement Details',
    items: [
      { key: 'purpose' as keyof NDAFormData, label: 'Purpose' },
      { key: 'effectiveDate' as keyof NDAFormData, label: 'Effective Date' },
      { key: 'mndaTermType' as keyof NDAFormData, label: 'MNDA Term' },
      { key: 'confidentialityTermType' as keyof NDAFormData, label: 'Confidentiality Term' },
      { key: 'governingLaw' as keyof NDAFormData, label: 'Governing Law' },
      { key: 'jurisdiction' as keyof NDAFormData, label: 'Jurisdiction' },
    ],
  },
  {
    label: 'Party 1',
    items: [
      { key: 'party1Name' as keyof NDAFormData, label: 'Name' },
      { key: 'party1Title' as keyof NDAFormData, label: 'Title' },
      { key: 'party1Company' as keyof NDAFormData, label: 'Company' },
      { key: 'party1Address' as keyof NDAFormData, label: 'Address' },
    ],
  },
  {
    label: 'Party 2',
    items: [
      { key: 'party2Name' as keyof NDAFormData, label: 'Name' },
      { key: 'party2Title' as keyof NDAFormData, label: 'Title' },
      { key: 'party2Company' as keyof NDAFormData, label: 'Company' },
      { key: 'party2Address' as keyof NDAFormData, label: 'Address' },
    ],
  },
]

const allDisplayedKeys = fieldGroups.flatMap((g) => g.items.map((i) => i.key))

const partyFormSections: Array<{
  label: string
  fields: Array<{ key: keyof NDAFormData; label: string; placeholder: string }>
}> = [
  {
    label: 'Party 1',
    fields: [
      { key: 'party1Name', label: 'Name', placeholder: 'Full name' },
      { key: 'party1Title', label: 'Title', placeholder: 'Job title' },
      { key: 'party1Company', label: 'Company', placeholder: 'Company name' },
      { key: 'party1Address', label: 'Notice Address', placeholder: 'Email or postal address' },
    ],
  },
  {
    label: 'Party 2',
    fields: [
      { key: 'party2Name', label: 'Name', placeholder: 'Full name' },
      { key: 'party2Title', label: 'Title', placeholder: 'Job title' },
      { key: 'party2Company', label: 'Company', placeholder: 'Company name' },
      { key: 'party2Address', label: 'Notice Address', placeholder: 'Email or postal address' },
    ],
  },
]

function isFormComplete(fields: NDAFormData): boolean {
  const required: Array<keyof NDAFormData> = [
    'purpose',
    'effectiveDate',
    'mndaTermType',
    'confidentialityTermType',
    'governingLaw',
    'jurisdiction',
    'party1Name',
    'party1Title',
    'party1Company',
    'party1Address',
    'party2Name',
    'party2Title',
    'party2Company',
    'party2Address',
  ]
  if (required.some((k) => !fields[k])) return false
  if (fields.mndaTermType === 'expires' && !fields.mndaTermYears) return false
  if (fields.confidentialityTermType === 'years' && !fields.confidentialityTermYears) return false
  return true
}

function applyExtractedFields(
  raw: Record<string, string | null>,
  setFields: React.Dispatch<React.SetStateAction<NDAFormData>>,
) {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v !== null && v !== undefined) merged[k] = v
  }
  if (Object.keys(merged).length > 0) {
    setFields((prev) => ({ ...prev, ...merged } as NDAFormData))
  }
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:border-transparent'

export default function CreatePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'chat' | 'form'>('chat')
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [fields, setFields] = useState<NDAFormData>({ ...defaultFields })
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [assistMessage, setAssistMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const canPreview = mode === 'form' ? isFormComplete(fields) : isComplete

  // ── Chat ─────────────────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading || isComplete) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/nda/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json()

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

      applyExtractedFields(data.fields as Record<string, string | null>, setFields)

      if (data.is_complete) setIsComplete(true)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  function handleFieldChange(key: keyof NDAFormData, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setAssistMessage(null)
  }

  async function handleAiAssist() {
    setIsLoading(true)
    setAssistMessage(null)

    try {
      const res = await fetch('/api/nda/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json()

      applyExtractedFields(data.fields as Record<string, string | null>, setFields)
      setAssistMessage(data.message as string)
    } catch {
      setAssistMessage('AI assist failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  function handlePreview() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fields))
    router.push('/preview')
  }

  const filledCount = allDisplayedKeys.filter((key) => Boolean(fields[key])).length

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-sm font-bold" style={{ color: '#032147' }}>
            Create Mutual NDA
          </h1>
        </div>

        {/* Mode toggle */}
        <div
          className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold"
          role="group"
          aria-label="Input mode"
        >
          <button
            onClick={() => setMode('chat')}
            aria-pressed={mode === 'chat'}
            className="px-4 py-1.5 transition-colors"
            style={mode === 'chat' ? { background: '#209dd7', color: '#fff' } : { color: '#888888' }}
          >
            Chat
          </button>
          <button
            onClick={() => setMode('form')}
            aria-pressed={mode === 'form'}
            className="px-4 py-1.5 transition-colors border-l border-slate-200"
            style={mode === 'form' ? { background: '#209dd7', color: '#fff' } : { color: '#888888' }}
          >
            Form
          </button>
        </div>

        <span className="text-xs text-slate-400">
          {filledCount}/{allDisplayedKeys.length} fields collected
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — Chat or Form */}
        {mode === 'chat' ? (
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: '#209dd7' }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}
                    style={msg.role === 'user' ? { background: '#209dd7' } : undefined}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2 justify-start">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: '#209dd7' }}
                  >
                    AI
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span
                        className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isComplete
                      ? 'All information collected!'
                      : 'Type your message… (Enter to send, Shift+Enter for new line)'
                  }
                  rows={2}
                  disabled={isLoading || isComplete}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isComplete}
                  className="text-white text-sm font-semibold px-5 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0 self-end"
                  style={{ background: '#753991' }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form mode */
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Agreement Details */}
              <section>
                <h2
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: '#032147' }}
                >
                  Agreement Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Purpose</label>
                    <textarea
                      rows={2}
                      value={fields.purpose}
                      onChange={(e) => handleFieldChange('purpose', e.target.value)}
                      placeholder="Why are the parties sharing confidential information?"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={fields.effectiveDate}
                      onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        MNDA Term
                      </label>
                      <select
                        value={fields.mndaTermType}
                        onChange={(e) => handleFieldChange('mndaTermType', e.target.value)}
                        className={`${inputCls} bg-white`}
                      >
                        <option value="expires">Fixed term (expires)</option>
                        <option value="until_terminated">Until terminated</option>
                      </select>
                    </div>
                    {fields.mndaTermType === 'expires' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Term (years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={fields.mndaTermYears}
                          onChange={(e) => handleFieldChange('mndaTermYears', e.target.value)}
                          placeholder="1"
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Confidentiality Term
                      </label>
                      <select
                        value={fields.confidentialityTermType}
                        onChange={(e) =>
                          handleFieldChange('confidentialityTermType', e.target.value)
                        }
                        className={`${inputCls} bg-white`}
                      >
                        <option value="years">Fixed years</option>
                        <option value="perpetuity">In perpetuity</option>
                      </select>
                    </div>
                    {fields.confidentialityTermType === 'years' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Term (years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={fields.confidentialityTermYears}
                          onChange={(e) =>
                            handleFieldChange('confidentialityTermYears', e.target.value)
                          }
                          placeholder="1"
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Governing Law
                      </label>
                      <input
                        type="text"
                        value={fields.governingLaw}
                        onChange={(e) => handleFieldChange('governingLaw', e.target.value)}
                        placeholder="e.g. Delaware"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Jurisdiction
                      </label>
                      <input
                        type="text"
                        value={fields.jurisdiction}
                        onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                        placeholder="e.g. New Castle, Delaware"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Modifications{' '}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={fields.modifications}
                      onChange={(e) => handleFieldChange('modifications', e.target.value)}
                      placeholder="Any changes to standard terms (leave blank if none)"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* Party sections */}
              {partyFormSections.map((section) => (
                <section key={section.label}>
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: '#032147' }}
                  >
                    {section.label}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {section.fields.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={fields[key]}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={placeholder}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* AI Assist bar */}
            <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0">
              {assistMessage && (
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">{assistMessage}</p>
              )}
              <button
                onClick={handleAiAssist}
                disabled={isLoading}
                className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: '#209dd7' }}
              >
                {isLoading ? 'AI is reviewing…' : 'AI Assist — Fill & Validate'}
              </button>
            </div>
          </div>
        )}

        {/* Fields panel (right) */}
        <div className="w-64 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-200 shrink-0">
            <h2
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#032147' }}
            >
              NDA Fields
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Populated from conversation</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {fieldGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.label}
                </div>
                <div className="space-y-2">
                  {group.items.map(({ key, label }) => {
                    const value = fields[key]
                    const isFilled = Boolean(value)
                    return (
                      <div key={key} className="flex items-start gap-2">
                        <span
                          className="text-xs shrink-0 mt-0.5 font-semibold"
                          style={{ color: isFilled ? '#209dd7' : '#d1d5db' }}
                        >
                          {isFilled ? '✓' : '○'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-600">{label}</div>
                          {value ? (
                            <div className="text-xs text-slate-400 truncate">{value}</div>
                          ) : (
                            <div className="text-xs text-slate-300">Not collected</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 border-t border-slate-200 shrink-0">
            <button
              onClick={handlePreview}
              disabled={!canPreview}
              className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ background: '#753991' }}
            >
              Preview NDA →
            </button>
            {!canPreview && (
              <p className="text-[10px] text-slate-400 text-center mt-2">
                {mode === 'chat'
                  ? 'Complete the chat to preview'
                  : 'Fill all required fields to preview'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
