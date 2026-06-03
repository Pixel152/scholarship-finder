import { useState } from 'react'

const apiBase = () => import.meta.env.VITE_API_URL || ''

export default function AuthPage({ onSuccess, onBack }) {
  const [tab,      setTab]      = useState('signup')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${apiBase()}/api/auth/${tab}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.')
      onSuccess({ token: data.token, email: data.email, cloudProfile: data.profile ?? null })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold text-blue-600 tracking-tight">ScholarMatch</span>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back
        </button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {tab === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {tab === 'signup'
                ? 'Your profile and results are saved to your account.'
                : 'Sign in to access your saved profile and results.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[['signup', 'Create Account'], ['login', 'Sign In']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setTab(val); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === val
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all mt-2 ${
                loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 hover:-translate-y-0.5'
              }`}
            >
              {loading
                ? 'Please wait…'
                : tab === 'signup'
                ? 'Create Account →'
                : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {tab === 'signup'
              ? 'Already have an account? '
              : "Don't have an account? "}
            <button
              onClick={() => { setTab(tab === 'signup' ? 'login' : 'signup'); setError('') }}
              className="text-blue-500 hover:underline font-medium"
            >
              {tab === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
