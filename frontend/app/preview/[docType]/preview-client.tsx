'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { getDocConfig } from '@/lib/documents'
import { TEMPLATES } from '@/lib/templates'

interface Props {
  docType: string
}

function CoverPageRow({ label, value, note }: { label: string; value?: string; note?: string }) {
  return (
    <tr className="border border-slate-300">
      <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 w-1/3 border-r border-slate-300 align-top text-sm">
        {label}
        {note && <div className="text-xs font-normal text-slate-400 mt-0.5">{note}</div>}
      </td>
      <td className="px-4 py-3 text-slate-800 text-sm whitespace-pre-wrap">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </td>
    </tr>
  )
}

function GenericCoverPage({
  docType,
  fields,
}: {
  docType: string
  fields: Record<string, string>
}) {
  const config = getDocConfig(docType)
  if (!config) return null

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-slate-300 pb-6">
        <h1 className="text-2xl font-bold text-slate-900">{config.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Cover Page</p>
      </div>

      <table className="w-full text-sm border-collapse">
        <tbody>
          {config.fieldDefs
            .filter((f) => {
              if (f.conditionalOn) {
                return fields[f.conditionalOn.field] === f.conditionalOn.value
              }
              return true
            })
            .map((field) => (
              <CoverPageRow
                key={field.key}
                label={field.label}
                value={fields[field.key]}
              />
            ))}
        </tbody>
      </table>

      <p className="text-sm text-slate-600">
        By signing this Cover Page, each party agrees to the terms of this {config.name}.
      </p>
    </div>
  )
}

export default function PreviewClient({ docType }: Props) {
  const router = useRouter()
  const config = getDocConfig(docType)
  const [fields, setFields] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!config) return
    const raw = sessionStorage.getItem(config.sessionKey)
    if (!raw) {
      router.replace(`/create/${docType}`)
      return
    }
    try {
      setFields(JSON.parse(raw))
    } catch {
      router.replace(`/create/${docType}`)
    }
  }, [config, docType, router])

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

  if (!fields) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const template = TEMPLATES[docType]

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href={`/create/${docType}`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Edit
          </Link>
          <span className="font-semibold text-sm" style={{ color: '#032147' }}>
            {config.name}
          </span>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: '#753991' }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-0">
        {/* Cover Page */}
        <div className="mb-16 print:mb-0 print:page-break-after-always">
          <GenericCoverPage docType={docType} fields={fields} />
        </div>

        {/* Standard Terms */}
        {template && (
          <div className="print:pt-8">
            <div className="border-t border-slate-200 pt-12 print:border-0 print:pt-0">
              <h2 className="text-lg font-bold text-slate-900 mb-8 text-center">Standard Terms</h2>
              <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    span: ({ className, children, ...props }) => (
                      <span
                        className={
                          className?.includes('keyterms_link') ||
                          className?.includes('orderform_link') ||
                          className?.includes('coverpage_link') ||
                          className?.includes('businessterms_link') ||
                          className?.includes('sow_link')
                            ? 'font-semibold text-blue-700'
                            : className?.includes('header_2')
                              ? 'font-bold text-slate-900'
                              : className?.includes('header_3')
                                ? 'font-semibold text-slate-800'
                                : ''
                        }
                        {...props}
                      >
                        {children}
                      </span>
                    ),
                  }}
                >
                  {template}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
