'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NDAFormData, SESSION_KEY, formatDate, formatMndaTerm, formatConfidentialityTerm } from '@/lib/nda'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-semibold text-slate-900 underline decoration-dotted" title={label}>
      {value || `[${label}]`}
    </span>
  )
}

function CoverPage({ data }: { data: NDAFormData }) {
  return (
    <div className="space-y-6">
      <div className="text-center border-b border-slate-300 pb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mutual Non-Disclosure Agreement</h1>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover Page
        (&ldquo;<strong>Cover Page</strong>&rdquo;) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0
        (&ldquo;<strong>Standard Terms</strong>&rdquo;) identical to those posted at{' '}
        <a
          href="https://commonpaper.com/standards/mutual-nda/1.0"
          className="underline text-slate-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          commonpaper.com/standards/mutual-nda/1.0
        </a>
        . Any modifications of the Standard Terms should be made on the Cover Page, which will
        control over conflicts with the Standard Terms.
      </p>

      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 w-1/3 border-r border-slate-300 align-top">
              Purpose
              <div className="text-xs font-normal text-slate-400 mt-0.5">
                How Confidential Information may be used
              </div>
            </td>
            <td className="px-4 py-3 text-slate-800">{data.purpose}</td>
          </tr>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300">
              Effective Date
            </td>
            <td className="px-4 py-3 text-slate-800">{formatDate(data.effectiveDate)}</td>
          </tr>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300 align-top">
              MNDA Term
              <div className="text-xs font-normal text-slate-400 mt-0.5">
                The length of this MNDA
              </div>
            </td>
            <td className="px-4 py-3 text-slate-800">{formatMndaTerm(data)}</td>
          </tr>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300 align-top">
              Term of Confidentiality
              <div className="text-xs font-normal text-slate-400 mt-0.5">
                How long Confidential Information is protected
              </div>
            </td>
            <td className="px-4 py-3 text-slate-800">{formatConfidentialityTerm(data)}</td>
          </tr>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300">
              Governing Law &amp; Jurisdiction
            </td>
            <td className="px-4 py-3 text-slate-800">
              <div>
                <span className="text-slate-500">Governing Law: </span>
                {data.governingLaw}
              </div>
              <div className="mt-1">
                <span className="text-slate-500">Jurisdiction: </span>
                {data.jurisdiction}
              </div>
            </td>
          </tr>
          {data.modifications && (
            <tr className="border border-slate-300">
              <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300 align-top">
                MNDA Modifications
              </td>
              <td className="px-4 py-3 text-slate-800 whitespace-pre-wrap">{data.modifications}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-sm text-slate-600">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border border-slate-300">
            <td className="bg-slate-50 px-4 py-2 w-1/3 border-r border-slate-300" />
            <th className="bg-slate-50 font-semibold text-slate-700 px-4 py-2 border-r border-slate-300 text-center">
              PARTY 1
            </th>
            <th className="bg-slate-50 font-semibold text-slate-700 px-4 py-2 text-center">
              PARTY 2
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Signature', p1: '', p2: '' },
            { label: 'Print Name', p1: data.party1Name, p2: data.party2Name },
            { label: 'Title', p1: data.party1Title, p2: data.party2Title },
            { label: 'Company', p1: data.party1Company, p2: data.party2Company },
            { label: 'Notice Address', p1: data.party1Address, p2: data.party2Address },
            { label: 'Date', p1: '', p2: '' },
          ].map(({ label, p1, p2 }) => (
            <tr key={label} className="border border-slate-300">
              <td className="bg-slate-50 font-semibold text-slate-700 px-4 py-3 border-r border-slate-300">
                {label}
              </td>
              <td className="px-4 py-3 text-slate-800 border-r border-slate-300 min-h-[2.5rem]">
                {p1}
              </td>
              <td className="px-4 py-3 text-slate-800 min-h-[2.5rem]">{p2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StandardTerms({ data }: { data: NDAFormData }) {
  const purpose = <Field label="Purpose" value={data.purpose} />
  const effectiveDate = <Field label="Effective Date" value={formatDate(data.effectiveDate)} />
  const mndaTerm = <Field label="MNDA Term" value={formatMndaTerm(data)} />
  const confidentialityTerm = (
    <Field label="Term of Confidentiality" value={formatConfidentialityTerm(data)} />
  )
  const governingLaw = <Field label="Governing Law" value={data.governingLaw} />
  const jurisdiction = <Field label="Jurisdiction" value={data.jurisdiction} />

  const sections = [
    {
      num: '1',
      title: 'Introduction',
      content: (
        <>
          This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the
          Cover Page (defined below)) (&ldquo;<strong>MNDA</strong>&rdquo;) allows each party (&ldquo;
          <strong>Disclosing Party</strong>&rdquo;) to disclose or make available information in
          connection with the {purpose} which (1) the Disclosing Party identifies to the receiving
          party (&ldquo;<strong>Receiving Party</strong>&rdquo;) as &ldquo;confidential&rdquo;,
          &ldquo;proprietary&rdquo;, or the like or (2) should be reasonably understood as
          confidential or proprietary due to its nature and the circumstances of its disclosure (&ldquo;
          <strong>Confidential Information</strong>&rdquo;). Each party&apos;s Confidential
          Information also includes the existence and status of the parties&apos; discussions and
          information on the Cover Page. Confidential Information includes technical or business
          information, product designs or roadmaps, requirements, pricing, security and compliance
          documentation, technology, inventions and know-how. To use this MNDA, the parties must
          complete and sign a cover page incorporating these Standard Terms (&ldquo;
          <strong>Cover Page</strong>&rdquo;). Each party is identified on the Cover Page and
          capitalized terms have the meanings given herein or on the Cover Page.
        </>
      ),
    },
    {
      num: '2',
      title: 'Use and Protection of Confidential Information',
      content: (
        <>
          The Receiving Party shall: (a) use Confidential Information solely for the {purpose}; (b)
          not disclose Confidential Information to third parties without the Disclosing Party&apos;s
          prior written approval, except that the Receiving Party may disclose Confidential
          Information to its employees, agents, advisors, contractors and other representatives
          having a reasonable need to know for the {purpose}, provided these representatives are
          bound by confidentiality obligations no less protective of the Disclosing Party than the
          applicable terms in this MNDA and the Receiving Party remains responsible for their
          compliance with this MNDA; and (c) protect Confidential Information using at least the
          same protections the Receiving Party uses for its own similar information but no less than
          a reasonable standard of care.
        </>
      ),
    },
    {
      num: '3',
      title: 'Exceptions',
      content: (
        <>
          The Receiving Party&apos;s obligations in this MNDA do not apply to information that it
          can demonstrate: (a) is or becomes publicly available through no fault of the Receiving
          Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party
          without confidentiality restrictions; (c) it rightfully obtained from a third party
          without confidentiality restrictions; or (d) it independently developed without using or
          referencing the Confidential Information.
        </>
      ),
    },
    {
      num: '4',
      title: 'Disclosures Required by Law',
      content: (
        <>
          The Receiving Party may disclose Confidential Information to the extent required by law,
          regulation or regulatory authority, subpoena or court order, provided (to the extent
          legally permitted) it provides the Disclosing Party reasonable advance notice of the
          required disclosure and reasonably cooperates, at the Disclosing Party&apos;s expense,
          with the Disclosing Party&apos;s efforts to obtain confidential treatment for the
          Confidential Information.
        </>
      ),
    },
    {
      num: '5',
      title: 'Term and Termination',
      content: (
        <>
          This MNDA commences on the {effectiveDate} and expires at the end of the {mndaTerm}.
          Either party may terminate this MNDA for any or no reason upon written notice to the
          other party. The Receiving Party&apos;s obligations relating to Confidential Information
          will survive for the {confidentialityTerm}, despite any expiration or termination of this
          MNDA.
        </>
      ),
    },
    {
      num: '6',
      title: 'Return or Destruction of Confidential Information',
      content: (
        <>
          Upon expiration or termination of this MNDA or upon the Disclosing Party&apos;s earlier
          request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly
          after the Disclosing Party&apos;s written request, destroy all Confidential Information in
          the Receiving Party&apos;s possession or control or return it to the Disclosing Party;
          and (c) if requested by the Disclosing Party, confirm its compliance with these
          obligations in writing. As an exception to subsection (b), the Receiving Party may retain
          Confidential Information in accordance with its standard backup or record retention
          policies or as required by law, but the terms of this MNDA will continue to apply to the
          retained Confidential Information.
        </>
      ),
    },
    {
      num: '7',
      title: 'Proprietary Rights',
      content: (
        <>
          The Disclosing Party retains all of its intellectual property and other rights in its
          Confidential Information and its disclosure to the Receiving Party grants no license under
          such rights.
        </>
      ),
    },
    {
      num: '8',
      title: 'Disclaimer',
      content: (
        <>
          ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS IS&rdquo;, WITH ALL FAULTS, AND
          WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS
          FOR A PARTICULAR PURPOSE.
        </>
      ),
    },
    {
      num: '9',
      title: 'Governing Law and Jurisdiction',
      content: (
        <>
          This MNDA and all matters relating hereto are governed by, and construed in accordance
          with, the laws of the State of {governingLaw}, without regard to the conflict of laws
          provisions of such {governingLaw}. Any legal suit, action, or proceeding relating to this
          MNDA must be instituted in the federal or state courts located in {jurisdiction}. Each
          party irrevocably submits to the exclusive jurisdiction of such {jurisdiction} in any such
          suit, action, or proceeding.
        </>
      ),
    },
    {
      num: '10',
      title: 'Equitable Relief',
      content: (
        <>
          A breach of this MNDA may cause irreparable harm for which monetary damages are an
          insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek
          appropriate equitable relief, including an injunction, in addition to its other remedies.
        </>
      ),
    },
    {
      num: '11',
      title: 'General',
      content: (
        <>
          Neither party has an obligation under this MNDA to disclose Confidential Information to
          the other or proceed with any proposed transaction. Neither party may assign this MNDA
          without the prior written consent of the other party, except that either party may assign
          this MNDA in connection with a merger, reorganization, acquisition or other transfer of
          all or substantially all its assets or voting securities. Any assignment in violation of
          this Section is null and void. This MNDA will bind and inure to the benefit of each
          party&apos;s permitted successors and assigns. Waivers must be signed by the waiving
          party&apos;s authorized representative and cannot be implied from conduct. If any
          provision of this MNDA is held unenforceable, it will be limited to the minimum extent
          necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover
          Page) constitutes the entire agreement of the parties with respect to its subject matter,
          and supersedes all prior and contemporaneous understandings, agreements, representations,
          and warranties, whether written or oral, regarding such subject matter. This MNDA may
          only be amended, modified, waived, or supplemented by an agreement in writing signed by
          both parties. Notices, requests and approvals under this MNDA must be sent in writing to
          the email or postal addresses on the Cover Page and are deemed delivered on receipt. This
          MNDA may be executed in counterparts, including electronic copies, each of which is
          deemed an original and which together form the same agreement.
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 border-b border-slate-300 pb-4">
        Standard Terms
      </h2>
      <ol className="space-y-4">
        {sections.map((s) => (
          <li key={s.num} className="text-sm text-slate-700 leading-relaxed">
            <span className="font-bold">
              {s.num}. {s.title}.
            </span>{' '}
            {s.content}
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-400 pt-4 border-t border-slate-200">
        Common Paper Mutual Non-Disclosure Agreement{' '}
        <a
          href="https://commonpaper.com/standards/mutual-nda/1.0/"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Version 1.0
        </a>{' '}
        free to use under{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        .
      </p>
    </div>
  )
}

export default function PreviewPage() {
  const router = useRouter()
  const [data, setData] = useState<NDAFormData | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      router.replace('/create')
      return
    }
    try {
      setData(JSON.parse(raw))
    } catch {
      router.replace('/create')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return null

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:p-0">
      {/* Toolbar — hidden when printing */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href="/create" className="text-sm text-slate-500 hover:text-slate-700">
          ← Edit
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Download PDF
        </button>
      </div>

      {/* Document */}
      <div
        className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-10 space-y-10
          print:max-w-none print:rounded-none print:border-0 print:shadow-none print:p-0"
      >
        <CoverPage data={data} />
        <div className="border-t-2 border-slate-200 pt-10">
          <StandardTerms data={data} />
        </div>
      </div>
    </div>
  )
}
