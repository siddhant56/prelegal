'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }

    setLoading(true)
    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      router.push('/documents')
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f7fa' }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: '#209dd7' }}>
            Prelegal
          </p>
          <h1 className="text-3xl font-bold" style={{ color: '#032147' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#888888' }}>
            {mode === 'signin' ? 'Sign in to your account to continue' : 'Get started with Prelegal'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#032147' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#032147' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#032147' }}>
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{ backgroundColor: '#753991', '--tw-ring-color': '#753991' } as React.CSSProperties}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: '#888888' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium"
              style={{ color: '#209dd7' }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
