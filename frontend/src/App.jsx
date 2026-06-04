import { useEffect, useRef, useState } from 'react'
import LandingHero from './components/LandingHero'
import ProfileView from './components/ProfileView'
import MultiStepForm from './components/MultiStepForm'
import Onboarding from './components/Onboarding'
import SearchProgress from './components/SearchProgress'
import Results from './components/Results'
import AuthPage from './components/AuthPage'
import { MOCK_PROFILE, MOCK_OUTPUT, MOCK_DATE, MOCK_COUNT } from './data/mockData'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const K = {
  profile: 'sm_profile',
  output:  'sm_last_output',
  date:    'sm_last_date',
  count:   'sm_last_count',
  token:   'sm_token',
  email:   'sm_email',
}

const ls = {
  get:    (k)    => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set:    (k, v) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)),
  remove: (k)    => localStorage.removeItem(k),
}

function loadLastSearch() {
  return {
    output: localStorage.getItem(K.output) || null,
    date:   localStorage.getItem(K.date)   || null,
    count:  parseInt(localStorage.getItem(K.count) || '0'),
  }
}

// ─── Cloud sync helpers ───────────────────────────────────────────────────────
const apiBase = import.meta.env.VITE_API_URL || ''

async function cloudSaveProfile(token, profile) {
  try {
    const res = await fetch(`${apiBase}/api/auth/profile`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ profile }),
    })
    return res.status
  } catch {
    return null
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,       setView]       = useState(() => {
    const token = localStorage.getItem(K.token)
    const savedProfile = ls.get(K.profile)
    return token && savedProfile ? 'profile' : 'landing'
  })
  const [profile,    setProfile]    = useState(() => ls.get(K.profile))
  const [lastSearch, setLastSearch] = useState(loadLastSearch)
  const [events,     setEvents]     = useState([])
  const [output,     setOutput]     = useState('')
  const [user,       setUser]       = useState(() => {
    const token = localStorage.getItem(K.token)
    const email = localStorage.getItem(K.email)
    return token && email ? { token, email } : null
  })
  const eventsRef = useRef([])

  useEffect(() => {
    const id = setInterval(() => setEvents([...eventsRef.current]), 500)
    return () => clearInterval(id)
  }, [])

  // ── persist profile ──────────────────────────────────────────────────────
  const persistProfile = async (data) => {
    setProfile(data)
    ls.set(K.profile, data)
    if (user) {
      const status = await cloudSaveProfile(user.token, data)
      if (status === 401) {
        setUser(null)
        ls.remove(K.token)
        ls.remove(K.email)
        setView('auth')
      }
    }
  }

  // ── persist search results ───────────────────────────────────────────────
  const persistResults = (out, count) => {
    const date = new Date().toISOString()
    setLastSearch({ output: out, date, count })
    localStorage.setItem(K.output, out)
    localStorage.setItem(K.date,   date)
    localStorage.setItem(K.count,  String(count))
  }

  // ── auth ─────────────────────────────────────────────────────────────────
  const handleAuthSuccess = ({ token, email, cloudProfile }) => {
    setUser({ token, email })
    ls.set(K.token, token)
    ls.set(K.email, email)
    if (cloudProfile) {
      setProfile(cloudProfile)
      ls.set(K.profile, cloudProfile)
      setView('profile')
    } else if (profile) {
      cloudSaveProfile(token, profile) // best-effort, token just issued so won't be 401
      setView('profile')
    } else {
      setView('setup')
    }
  }

  const handleLogout = () => {
    setUser(null)
    ls.remove(K.token)
    ls.remove(K.email)
    setView('landing')
  }

  // ── demo mode ────────────────────────────────────────────────────────────
  const loadDemo = () => {
    setProfile(MOCK_PROFILE)
    ls.set(K.profile, MOCK_PROFILE)
    const ls2 = { output: MOCK_OUTPUT, date: MOCK_DATE, count: MOCK_COUNT }
    setLastSearch(ls2)
    localStorage.setItem(K.output, MOCK_OUTPUT)
    localStorage.setItem(K.date,   MOCK_DATE)
    localStorage.setItem(K.count,  String(MOCK_COUNT))
    setOutput(MOCK_OUTPUT)
    setView('results')
  }

  // ── streaming search ─────────────────────────────────────────────────────
  const runSearch = async (profileData) => {
    eventsRef.current = []
    setOutput('')
    setView('searching')

    let fullText = ''
    try {
      const res = await fetch(`${apiBase}/api/search`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(profileData),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          buf += decoder.decode()
          break
        }
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop()
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(part.slice(6))
            if (ev.type === 'heartbeat') continue
            if (ev.type === 'done') {
              const count = (fullText.match(/^#\d+\./gm) || []).length
              persistResults(fullText, count)
              setOutput(fullText)
              setView('results')
              return
            }
            if (ev.type === 'text') fullText += ev.content + '\n\n'
            if (['search', 'extract', 'text', 'error'].includes(ev.type)) {
              eventsRef.current = [...eventsRef.current, ev]
            }
          } catch {}
        }
      }
      if (fullText) {
        const count = (fullText.match(/^#\d+\./gm) || []).length
        persistResults(fullText, count)
        setOutput(fullText)
        setView('results')
      }
    } catch (err) {
      eventsRef.current = [...eventsRef.current, { type: 'error', message: err.message }]
    }
  }

  const handleSetup = (data) => { persistProfile(data); runSearch(data) }
  const handleEdit  = (data) => { persistProfile(data); setView('profile') }

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'landing' && (
        <LandingHero onStart={() => setView('auth')} onDemo={loadDemo} />
      )}
      {view === 'auth' && (
        <AuthPage onSuccess={handleAuthSuccess} onBack={() => setView('landing')} />
      )}
      {view === 'setup' && (
        <Onboarding onSubmit={handleSetup} onBack={() => setView('auth')} />
      )}
      {view === 'edit' && (
        <MultiStepForm
          initialData={profile}
          onSubmit={handleEdit}
          onBack={() => setView('profile')}
          editMode
        />
      )}
      {view === 'profile' && (
        <ProfileView
          profile={profile}
          lastSearch={lastSearch}
          user={user}
          onSearch={() => runSearch(profile)}
          onEdit={() => setView('edit')}
          onViewResults={() => { setOutput(lastSearch.output); setView('results') }}
          onLogout={handleLogout}
        />
      )}
      {view === 'searching' && <SearchProgress events={events} onBack={() => setView('profile')} />}
      {view === 'results' && (
        <Results
          output={output}
          onProfile={() => setView('profile')}
          onNewSearch={() => runSearch(profile)}
        />
      )}
    </div>
  )
}
