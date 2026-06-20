'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DOC_CONFIGS } from '@/lib/documents'
import { useRequireAuth, logout } from '@/lib/auth'

interface SavedDocument {
  id: number
  doc_type: string
  title: string
  created_at: string
  updated_at: string
}

const icons: Record<string, string> = {
  'mutual-nda': '🤝',
  'design-partner-agreement': '🎨',
  'pilot-agreement': '🚀',
  'ai-addendum': '🤖',
  'baa': '🏥',
  'csa': '☁️',
  'dpa': '🔒',
  'software-license-agreement': '💾',
  'partnership-agreement': '🤝',
  'psa': '💼',
  'sla': '📊',
}

export default function DocumentsPage() {
  const router = useRouter()
  const { user, loading } = useRequireAuth()
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/documents', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedDocs(data)
      })
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }, [user])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/documents/${id}`, { method: 'DELETE', credentials: 'include' })
    setSavedDocs((prev) => prev.filter((d) => d.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-xl" style={{ color: '#032147' }}>
            prelegal
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#888' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-14">
        {/* My Documents */}
        {!docsLoading && savedDocs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#032147' }}>
              My Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/create/${doc.doc_type}?docId=${doc.id}`)}
                  className="text-left p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-150 group relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{icons[doc.doc_type] ?? '📄'}</span>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#032147' }}>
                    {doc.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {DOC_CONFIGS[doc.doc_type]?.name ?? doc.doc_type}
                  </p>
                  <p className="text-xs text-gray-300 mt-2">
                    Edited {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Create New */}
        <section>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#032147' }}>
              {savedDocs.length > 0 ? 'Create New' : 'Choose a Document'}
            </h1>
            <p className="text-gray-500">
              Select the type of legal agreement you'd like to create. Our AI will guide you through the details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.values(DOC_CONFIGS).map((config) => (
              <button
                key={config.id}
                onClick={() => router.push(`/create/${config.id}`)}
                className="text-left p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-150 group"
              >
                <div className="text-2xl mb-3">{icons[config.id] ?? '📄'}</div>
                <h2
                  className="font-semibold text-base mb-2 group-hover:text-blue-600 transition-colors"
                  style={{ color: '#032147' }}
                >
                  {config.name}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">{config.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
