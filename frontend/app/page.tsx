import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Prelegal</p>
          <h1 className="text-4xl font-bold text-slate-900">Mutual NDA Creator</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Generate a sign-ready Mutual Non-Disclosure Agreement in minutes.
            Fill in the key details, preview the complete document, and download it as a PDF.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-block bg-slate-900 text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Create NDA →
        </Link>
        <p className="text-xs text-slate-400">
          Based on the{' '}
          <a
            href="https://commonpaper.com/standards/mutual-nda/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            Common Paper Mutual NDA v1.0
          </a>
          {' '}— free to use under CC BY 4.0.
        </p>
      </div>
    </main>
  )
}
