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

export default function CreatePage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [fields, setFields] = useState<NDAFormData>({ ...defaultFields })
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

      const extracted = data.fields as Record<string, string | null>
      const merged: Record<string, string> = {}
      for (const [k, v] of Object.entries(extracted)) {
        if (v !== null && v !== undefined) {
          merged[k] = v
        }
      }
      if (Object.keys(merged).length > 0) {
        setFields((prev) => ({ ...prev, ...merged } as NDAFormData))
      }

      if (data.is_complete) {
        setIsComplete(true)
      }
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
        <span className="text-xs text-slate-400">
          {filledCount}/{allDisplayedKeys.length} fields collected
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
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

          {/* Input area */}
          <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isComplete ? 'All information collected!' : 'Type your message… (Enter to send, Shift+Enter for new line)'}
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

        {/* Fields panel */}
        <div className="w-64 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-200 shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#032147' }}>
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
              disabled={!isComplete}
              className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ background: '#753991' }}
            >
              Preview NDA →
            </button>
            {!isComplete && (
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Complete the chat to preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
