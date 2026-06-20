'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push('/documents')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f7fa' }}>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: '#209dd7' }}>
            Prelegal
          </p>
          <h1 className="text-3xl font-bold" style={{ color: '#032147' }}>
            Welcome back
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#888888' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#032147' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#032147' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#753991', '--tw-ring-color': '#753991' } as React.CSSProperties}
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: '#888888' }}>
            Don&apos;t have an account?{' '}
            <span className="font-medium cursor-pointer" style={{ color: '#209dd7' }}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}
