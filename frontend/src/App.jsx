import { useRef, useState } from 'react'
import LandingHero from './components/LandingHero'
import ProfileView from './components/ProfileView'
import MultiStepForm from './components/MultiStepForm'
import SearchProgress from './components/SearchProgress'
import Results from './components/Results'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const KEYS = {
  profile:   'sm_profile',
  output:    'sm_last_output',
  date:      'sm_last_date',
  count:     'sm_last_count',
}

function load(key)        { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }
function save(key, value) { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)) }

function loadLastSearch() {
  return {
    output: localStorage.getItem(KEYS.output) || null,
    date:   localStorage.getItem(KEYS.date)   || null,
    count:  parseInt(localStorage.getItem(KEYS.count) || '0'),
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,       setView]       = useState(() => load(KEYS.profile) ? 'profile' : 'landing')
  const [profile,    setProfile]    = useState(() => load(KEYS.profile))
  const [lastSearch, setLastSearch] = useState(loadLastSearch)
  const [events,     setEvents]     = useState([])
  const [output,     setOutput]     = useState('')
  const eventsRef = useRef([])

  // ── persist profile ──────────────────────────────────────────────────────
  const persistProfile = (data) => {
    setProfile(data)
    save(KEYS.profile, data)
  }

  // ── persist search results ───────────────────────────────────────────────
  const persistResults = (out, count) => {
    const date = new Date().toISOString()
    const ls = { output: out, date, count }
    setLastSearch(ls)
    localStorage.setItem(KEYS.output,  out)
    localStorage.setItem(KEYS.date,    date)
    localStorage.setItem(KEYS.count,   String(count))
  }

  // ── streaming search ─────────────────────────────────────────────────────
  const runSearch = async (profileData) => {
    eventsRef.current = []
    setEvents([])
    setOutput('')
    setView('searching')

    const apiBase = import.meta.env.VITE_API_URL || ''
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
        if (done) break

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
            if (ev.type === 'text') {
              fullText += ev.content + '\n\n'
            }
            if (['search', 'extract', 'text', 'error'].includes(ev.type)) {
              eventsRef.current = [...eventsRef.current, ev]
              setEvents([...eventsRef.current])
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
      setEvents([...eventsRef.current])
    }
  }

  // ── form submit: setup (first time) vs edit (update profile) ─────────────
  const handleSetup = (data) => { persistProfile(data); runSearch(data) }
  const handleEdit  = (data) => { persistProfile(data); setView('profile') }

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'landing' && (
        <LandingHero onStart={() => setView('setup')} />
      )}

      {view === 'setup' && (
        <MultiStepForm
          onSubmit={handleSetup}
          onBack={() => setView('landing')}
        />
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
          onSearch={() => runSearch(profile)}
          onEdit={() => setView('edit')}
          onViewResults={() => { setOutput(lastSearch.output); setView('results') }}
        />
      )}

      {view === 'searching' && (
        <SearchProgress events={events} />
      )}

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
