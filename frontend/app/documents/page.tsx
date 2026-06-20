'use client'

import { useRouter } from 'next/navigation'
import { DOC_CONFIGS } from '@/lib/documents'

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

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-xl" style={{ color: '#032147' }}>
            prelegal
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#032147' }}>
            Choose a Document
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
      </main>
    </div>
  )
}
