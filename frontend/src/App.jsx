import { useEffect, useRef, useState } from 'react'
import ProfileView from './components/ProfileView'
import MultiStepForm from './components/MultiStepForm'
import Onboarding from './components/Onboarding'
import Results, { makeTrackerId } from './components/Results'
import TrackerView from './components/TrackerView'
import DashboardLayout from './components/DashboardLayout'
import SearchNotification from './components/SearchNotification'
import ImportReviewPage from './components/ImportReviewPage'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const K = {
  profile: 'sm_profile',
  output:  'sm_last_output',
  date:    'sm_last_date',
  count:   'sm_last_count',
  token:   'sm_token',
  email:   'sm_email',
  tracker: 'sm_tracker',
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
  const [view,         setView]         = useState(() => {
    const token = localStorage.getItem(K.token)
    const savedProfile = ls.get(K.profile)
    return token && savedProfile ? 'profile' : 'setup'
  })
  const [profile,      setProfile]      = useState(() => ls.get(K.profile))
  const [lastSearch,   setLastSearch]   = useState(loadLastSearch)
  const [events,       setEvents]       = useState([])
  const [output,       setOutput]       = useState('')
  const [searchStatus,   setSearchStatus]   = useState('idle')
  const [trackerItems,   setTrackerItems]   = useState(() => ls.get(K.tracker) || [])
  const [user,           setUser]           = useState(() => {
    const token = localStorage.getItem(K.token)
    const email = localStorage.getItem(K.email)
    return token && email ? { token, email } : null
  })
  const [importState,    setImportState]    = useState(null)  // { profile, warnings, importedKeys, currentData }
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
        setView('setup')
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

  // ── new user finishes onboarding ─────────────────────────────────────────
  const handleOnboardingComplete = ({ profile: profileData, token, email }) => {
    const newUser = { token, email }
    setUser(newUser)
    ls.set(K.token, token)
    ls.set(K.email, email)
    setProfile(profileData)
    ls.set(K.profile, profileData)
    cloudSaveProfile(token, profileData)
    setView('profile')
    runSearch(profileData)
  }

  // ── returning user signs in via onboarding ───────────────────────────────
  const handleSignIn = ({ token, email, cloudProfile }) => {
    setUser({ token, email })
    ls.set(K.token, token)
    ls.set(K.email, email)
    if (cloudProfile) {
      setProfile(cloudProfile)
      ls.set(K.profile, cloudProfile)
      setView('profile')
    } else if (profile) {
      cloudSaveProfile(token, profile)
      setView('profile')
    } else {
      setView('setup')
    }
  }

  // ── tracker CRUD ─────────────────────────────────────────────────────────
  const saveTrackerItem = (s) => {
    const item = {
      id: makeTrackerId(s),
      name: s.name,
      org: s.org,
      amount: s.amount,
      deadline: s.deadline,
      scholarshipStatus: s.status,
      applyUrl: s.applyUrl,
      applyContact: s.applyContact,
      score: s.score,
      trackerStatus: 'saved',
      notes: '',
      addedAt: new Date().toISOString(),
    }
    setTrackerItems(prev => {
      const next = [...prev.filter(t => t.id !== item.id), item]
      ls.set(K.tracker, next)
      return next
    })
  }

  const unsaveTrackerItem = (id) => {
    setTrackerItems(prev => {
      const next = prev.filter(t => t.id !== id)
      ls.set(K.tracker, next)
      return next
    })
  }

  const updateTrackerStatus = (id, status) => {
    setTrackerItems(prev => {
      const next = prev.map(t => t.id === id ? { ...t, trackerStatus: status } : t)
      ls.set(K.tracker, next)
      return next
    })
  }

  const updateTrackerNotes = (id, notes) => {
    setTrackerItems(prev => {
      const next = prev.map(t => t.id === id ? { ...t, notes } : t)
      ls.set(K.tracker, next)
      return next
    })
  }

  const handleLogout = () => {
    setUser(null)
    ls.remove(K.token)
    ls.remove(K.email)
    setSearchStatus('idle')
    setView('setup')
  }

  // ── streaming search (runs in background) ───────────────────────────────
  const runSearch = async (profileData) => {
    eventsRef.current = []
    setEvents([])
    setOutput('')
    setSearchStatus('running')

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
              setSearchStatus('done')
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
        setSearchStatus('done')
      } else {
        setSearchStatus('failed')
      }
    } catch (err) {
      eventsRef.current = [...eventsRef.current, { type: 'error', message: err.message }]
      setSearchStatus('failed')
    }
  }

  const handleEdit = (data) => { persistProfile(data); setView('profile') }

  const handleImportReview = ({ profile, warnings, currentData }) => {
    const importedKeys = Object.keys(profile).filter(k => {
      const v = profile[k]
      if (Array.isArray(v)) return v.length > 0
      return v !== null && v !== undefined && v !== '' && v !== false
    })
    setImportState({ profile, warnings, importedKeys, currentData })
    setView('import-review')
  }

  const handleImportSave = (mergedProfile) => {
    persistProfile(mergedProfile)
    setImportState(null)
    setView('profile')
  }

  const viewResults = () => {
    setOutput(output || lastSearch.output || '')
    setView('results')
  }

  const handleNavigate = (target) => {
    if (target === 'results') {
      if (!output && !lastSearch.output) return
      viewResults()
    } else if (target === 'edit') {
      setView('edit')
    } else {
      setView(target)
    }
  }

  const dashboardViews = ['profile', 'results', 'tracker']

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'setup' && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSignIn={handleSignIn}
          user={user}
        />
      )}
      {view === 'edit' && (
        <MultiStepForm
          initialData={profile}
          onSubmit={handleEdit}
          onBack={() => setView('profile')}
          onImportReview={handleImportReview}
          editMode
        />
      )}
      {view === 'import-review' && importState && (
        <ImportReviewPage
          initialProfile={importState.profile}
          currentProfile={importState.currentData || profile}
          importedKeys={importState.importedKeys}
          warnings={importState.warnings}
          onSave={handleImportSave}
          onCancel={() => setView('edit')}
        />
      )}

      {dashboardViews.includes(view) && (
        <DashboardLayout
          activeView={view}
          onNavigate={handleNavigate}
          trackerCount={trackerItems.length}
          hasResults={!!(output || lastSearch.output)}
        >
          {view === 'profile' && (
            <ProfileView
              profile={profile}
              lastSearch={lastSearch}
              user={user}
              onSearch={() => runSearch(profile)}
              onEdit={() => setView('edit')}
              onViewResults={viewResults}
              onLogout={handleLogout}
              searchRunning={searchStatus === 'running'}
            />
          )}
          {view === 'tracker' && (
            <TrackerView
              items={trackerItems}
              onUpdateStatus={updateTrackerStatus}
              onUpdateNotes={updateTrackerNotes}
              onRemove={unsaveTrackerItem}
            />
          )}
          {view === 'results' && (
            <Results
              output={output || lastSearch.output || ''}
              onProfile={() => setView('profile')}
              onNewSearch={() => { setView('profile'); runSearch(profile) }}
              trackerIds={new Set(trackerItems.map(t => t.id))}
              onSave={saveTrackerItem}
              onUnsave={unsaveTrackerItem}
            />
          )}
        </DashboardLayout>
      )}

      {/* Floating search notification — shown on all views except setup */}
      {view !== 'setup' && (
        <SearchNotification
          events={events}
          status={searchStatus}
          output={output}
          onViewResults={viewResults}
          onRetry={() => runSearch(profile)}
          onDismiss={() => setSearchStatus('idle')}
        />
      )}
    </div>
  )
}
