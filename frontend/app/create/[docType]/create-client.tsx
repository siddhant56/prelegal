'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getDocConfig,
  defaultFields,
  isDocComplete,
  isFieldRequired,
  type FieldDef,
} from '@/lib/documents'
import { useRequireAuth } from '@/lib/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  docType: string
}

export default function CreateClient({ docType }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docId = searchParams.get('docId')
  const config = getDocConfig(docType)
  const { loading: authLoading } = useRequireAuth()

  const [mode, setMode] = useState<'chat' | 'form'>('chat')
  const [fields, setFields] = useState<Record<string, string>>(() =>
    config ? defaultFields(config) : {}
  )
  const [messages, setMessages] = useState<Message[]>(() =>
    config ? [{ role: 'assistant', content: config.openingMessage }] : []
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load existing document if docId is in URL
  useEffect(() => {
    if (!docId || !config) return
    fetch(`/api/documents/${docId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.fields) {
          setFields((prev) => {
            const next = { ...prev }
            for (const [k, v] of Object.entries(data.fields as Record<string, string>)) {
              if (v) next[k] = v
            }
            return next
          })
        }
      })
      .catch(() => {})
  }, [docId, config])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Unknown document type: {docType}</p>
          <Link href="/documents" className="text-blue-600 hover:underline">
            ← Back to documents
          </Link>
        </div>
      </div>
    )
  }

  function applyExtractedFields(extracted: Record<string, string | null>) {
    setFields((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(extracted)) {
        if (v !== null && v !== undefined) {
          next[k] = String(v)
        }
      }
      return next
    })
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setError(null)

    const userMsg: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/document/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          doc_type: docType,
          messages: nextMessages,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const assistantMsg: Message = { role: 'assistant', content: data.message }
      setMessages((prev) => [...prev, assistantMsg])
      applyExtractedFields(data.fields ?? {})
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAutofill() {
    setAutofilling(true)
    setError(null)
    try {
      const res = await fetch('/api/document/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doc_type: docType, fields }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      applyExtractedFields(data.fields ?? {})
    } catch {
      setError('Autofill failed. Please try again.')
    } finally {
      setAutofilling(false)
    }
  }

  async function handlePreview() {
    setSaving(true)
    setError(null)
    try {
      // Write to sessionStorage for preview page (fast, no round-trip)
      sessionStorage.setItem(config!.sessionKey, JSON.stringify(fields))

      // Persist to backend
      const title = _buildTitle(fields, config!.name)
      if (docId) {
        // Update existing document
        await fetch(`/api/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, fields }),
        })
        router.push(`/preview/${docType}`)
      } else {
        // Create new document
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ doc_type: docType, title, fields }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        router.push(`/preview/${docType}?docId=${data.id}`)
      }
    } catch {
      // Fallback: navigate even if save failed
      router.push(`/preview/${docType}`)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formComplete = isDocComplete(fields, config)
  const canPreview = formComplete

  const completedCount = config.fieldDefs.filter(
    (f) => isFieldRequired(f, fields) && fields[f.key]?.trim()
  ).length
  const totalRequired = config.fieldDefs.filter((f) => isFieldRequired(f, fields)).length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/documents" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Documents
            </Link>
            <span className="font-semibold" style={{ color: '#032147' }}>
              {docId ? 'Edit' : 'Create'} {config.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('chat')}
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors"
              style={{
                background: mode === 'chat' ? '#209dd7' : 'transparent',
                color: mode === 'chat' ? '#fff' : '#888',
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setMode('form')}
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors"
              style={{
                background: mode === 'form' ? '#209dd7' : 'transparent',
                color: mode === 'form' ? '#fff' : '#888',
              }}
            >
              Form
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left pane: chat or form */}
        <div className="flex-1 flex flex-col">
          {mode === 'chat' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? { background: '#209dd7', color: '#fff' }
                          : { background: '#fff', color: '#032147', border: '1px solid #e5e7eb' }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#aaa' }}
                    >
                      Thinking…
                    </div>
                  </div>
                )}
                {error && (
                  <div className="text-center text-sm text-red-500">{error}</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div
                className="border-t p-4 flex-shrink-0"
                style={{ background: '#fff', borderColor: '#e5e7eb' }}
              >
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={2}
                    className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb' }}
                    placeholder="Type your message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
                    style={{ background: '#753991' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Form mode */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-xl space-y-8">
                {config.formSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-4">
                      {section.title}
                    </h3>
                    <div className="space-y-4">
                      {section.fields.map((field) => {
                        const show = !field.conditionalOn || fields[field.conditionalOn.field] === field.conditionalOn.value
                        if (!show) return null
                        return (
                          <FormField
                            key={field.key}
                            field={field}
                            value={fields[field.key] ?? ''}
                            onChange={(v) => setFields((prev) => ({ ...prev, [field.key]: v }))}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAutofill}
                    disabled={autofilling}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40"
                    style={{ borderColor: '#209dd7', color: '#209dd7' }}
                  >
                    {autofilling ? 'Working…' : 'AI Assist'}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right pane: field status + preview */}
        <div
          className="w-72 border-l flex-shrink-0 flex flex-col"
          style={{ background: '#fff', borderColor: '#e5e7eb' }}
        >
          <div className="p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm" style={{ color: '#032147' }}>
                {config.name} Fields
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {completedCount} / {totalRequired} required fields filled
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: totalRequired > 0 ? `${(completedCount / totalRequired) * 100}%` : '0%',
                  background: '#209dd7',
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            {config.fieldGroups.map((group) => (
              <div key={group.label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {group.label}
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const val = fields[item.key]
                    const filled = !!val?.trim()
                    return (
                      <div key={item.key} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: filled ? '#22c55e' : '#d1d5db' }}>
                          {filled ? '✓' : '○'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-400">{item.label}</div>
                          {filled && (
                            <div className="text-xs truncate" style={{ color: '#032147' }}>
                              {val}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t" style={{ borderColor: '#e5e7eb' }}>
            <button
              onClick={handlePreview}
              disabled={!canPreview || saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-30"
              style={{ background: '#753991' }}
            >
              {saving ? 'Saving…' : config.previewButtonLabel}
            </button>
            {!canPreview && (
              <p className="mt-2 text-xs text-center text-gray-400">
                Complete all fields to preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function _buildTitle(fields: Record<string, string>, docName: string): string {
  const company = fields.party1Company || fields.customerName || fields.providerName || ''
  if (company) return `${docName} — ${company}`
  return `${docName} — ${new Date().toLocaleDateString()}`
}

function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  const base =
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const style = { borderColor: '#e5e7eb' }

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#032147' }}>
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.type === 'select' && field.options ? (
        <select className={base} style={style} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          className={base}
          style={style}
          rows={3}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={field.type === 'date' ? 'date' : 'text'}
          className={base}
          style={style}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
