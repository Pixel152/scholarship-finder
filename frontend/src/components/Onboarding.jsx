import { useState, useEffect, useRef } from 'react'

const DRAFT_KEY = 'sm_form_draft'
const API = import.meta.env.VITE_API_URL || ''

const INITIAL = {
  name: '', year: '', university: '', major: '', gpa: '',
  intended_profession: '', hometown_city: '', hometown_state: '',
  hometown_county: '', state_of_residence: '', high_school: '',
  high_school_state: '', citizenship: 'us_citizen', heritage: '',
  religion: '', languages: [], first_gen: false, financial_need: false,
  income_bracket: '', military_family: false, disability: '',
  activities: [], national_club_orgs: [], honors: [],
  parent_employer: '', parent_industry: '', parent_union: '',
  career_goal: '', already_applied: [],
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CLUB_ORG_SUGGESTIONS = [
  '4-H', 'FFA (Future Farmers of America)', 'DECA', 'FBLA (Future Business Leaders of America)',
  'FCCLA', 'HOSA (Health Occupations Students of America)', 'Key Club International',
  'National Honor Society (NHS)', 'National Beta Club', 'SkillsUSA',
  'Technology Student Association (TSA)', 'Eagle Scout / Boy Scouts of America',
  'Girl Scouts Gold Award', 'Rotary International / Interact Club', 'FIRST Robotics',
  'Science Olympiad', 'NSDA / Speech and Debate', 'Academic Decathlon', 'MATHCOUNTS',
  'Civil Air Patrol (CAP)', 'JROTC', 'Junior Achievement (JA)', 'Phi Theta Kappa (PTK)',
  'Student Council / SGA', 'Model United Nations (MUN)', 'American Legion / Sons of the American Legion',
  'Elks Lodge (BPOE)', 'Jack and Jill of America', 'NAACP Youth Council',
  'Junior State of America (JSA)', 'Future Problem Solving Program (FPSP)',
  'Odyssey of the Mind', 'YMCA Youth & Government',
]

function TagInput({ value = [], onChange, placeholder, inputRef, suggestions = [] }) {
  const [text,      setText]      = useState('')
  const [open,      setOpen]      = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)

  const filtered = text.trim().length > 0 && suggestions.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(text.toLowerCase()) && !value.includes(s)).slice(0, 7)
    : []

  const commit = (tag) => {
    const t = (tag || text).trim().replace(/,+$/, '')
    if (t && !value.includes(t)) onChange([...value, t])
    setText('')
    setOpen(false)
    setActiveIdx(-1)
  }

  useEffect(() => {
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const showDropdown = open && filtered.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="border-b-2 border-gray-200 focus-within:border-blue-500 transition-colors pb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-sm px-3 py-1 rounded-full border border-blue-200">
              {tag}
              <button type="button" onClick={() => onChange(value.filter(t => t !== tag))}
                className="text-blue-400 hover:text-blue-700 font-bold leading-none ml-0.5">×</button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          className="w-full outline-none text-2xl font-light text-gray-900 placeholder-gray-300 bg-transparent"
          value={text}
          onChange={e => { setText(e.target.value); setOpen(true); setActiveIdx(-1) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
            else if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              if (activeIdx >= 0 && filtered[activeIdx]) commit(filtered[activeIdx])
              else commit()
            } else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); setActiveIdx(-1) }, 150)}
          placeholder={value.length === 0 ? placeholder : 'Add more...'}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggested organizations</span>
          </div>
          {filtered.map((s, i) => (
            <button key={s} type="button" onMouseDown={() => commit(s)}
              className={`w-full text-left px-4 py-3 text-base transition-colors ${
                i === activeIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'
              }`}>
              {s}
            </button>
          ))}
          {text.trim() && !suggestions.some(s => s.toLowerCase() === text.trim().toLowerCase()) && (
            <button type="button" onMouseDown={() => commit(text.trim())}
              className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors">
              Add "<span className="font-medium text-gray-800">{text.trim()}</span>"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Confetti() {
  const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4']
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    id: i, color: COLORS[i % COLORS.length],
    left: `${(i / 70) * 100 + (i % 3 - 1) * 3}%`,
    delay: `${(i * 0.018) % 0.9}s`,
    width: `${5 + (i % 5) * 2}px`, height: `${8 + (i % 4) * 3}px`,
    duration: `${1.2 + (i % 5) * 0.2}s`, rotate: i % 2 === 0 ? '0deg' : '45deg',
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', backgroundColor: p.color, left: p.left, top: '-14px',
          width: p.width, height: p.height, borderRadius: '2px',
          transform: `rotate(${p.rotate})`,
          animation: `confettiFall ${p.duration} ease-in ${p.delay} forwards`,
        }} />
      ))}
    </div>
  )
}

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 group">
      <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-lg font-light leading-none">←</span>
      <span className="text-xl leading-none">🎓</span>
      <span className="font-black text-gray-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">
        ScholarMatch
      </span>
    </button>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

const FLOATERS = [
  { text: '$10,000 · NGLCC LGBTQ+ Scholarship',    top: '11%', left: '2%'  },
  { text: '$5,000 · First-Gen STEM Grant',          top: '20%', right: '1%' },
  { text: '$3,000 · Hometown Community Foundation', top: '60%', left: '1%'  },
  { text: '$8,000 · Union Workers Family Fund',     top: '67%', right: '2%' },
  { text: '$2,500 · Korean American Scholarship',   top: '43%', left: '0%'  },
  { text: '$15,000 · National Merit Special',       top: '37%', right: '0%' },
]

function WelcomeScreen({ onStart, onSignIn }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Floating scholarship chips */}
      <div className="absolute inset-0 pointer-events-none select-none hidden lg:block">
        {FLOATERS.map((f, i) => (
          <div
            key={i}
            className="absolute opacity-0 animate-fade-up bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm"
            style={{ top: f.top, left: f.left, right: f.right, animationDelay: `${0.5 + i * 0.15}s` }}
          >
            {f.text}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-xl">
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: '0s' }}>
          <span className="inline-block bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            🎓 AI-Powered Scholarship Finder
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-black text-gray-900 leading-none opacity-0 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          Find scholarships<br />
          <span className="text-blue-600">built for you.</span>
        </h1>

        <p
          className="text-lg text-gray-500 mt-6 max-w-sm mx-auto leading-relaxed opacity-0 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          Not the generic ones. Niche awards matched to your heritage, hometown, clubs, and employer — scholarships most students never find.
        </p>

        <div
          className="mt-10 flex flex-col items-center gap-4 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <button
            onClick={onStart}
            className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Find My Scholarships →
          </button>
          <button onClick={onSignIn} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Already have an account? Sign in →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question definitions ──────────────────────────────────────────────────────

function buildQuestions(data) {
  const first = data.name.split(' ')[0] || ''
  return [
    {
      id: 'name', q: "What's your name?",
      sub: "We'll personalize your entire scholarship search.",
      type: 'text', field: 'name', placeholder: 'Your full name',
      required: true, isValid: d => d.name.trim().length > 1,
    },
    {
      id: 'university',
      q: first ? `Nice to meet you, ${first}! 👋 Where do you study?` : "Where do you study?",
      sub: 'Your school unlocks department grants and alumni-funded awards.',
      type: 'text', field: 'university', placeholder: 'Columbia University',
      required: true, isValid: d => d.university.trim().length > 1,
    },
    {
      id: 'major', q: "What are you studying?",
      sub: 'Professional associations in your field fund thousands of scholarships.',
      type: 'text', field: 'major', placeholder: 'Computer Science',
      required: true, isValid: d => d.major.trim().length > 1,
    },
    {
      id: 'year', q: "What year are you in?",
      type: 'buttons', field: 'year', required: true, isValid: d => !!d.year,
      options: [
        { value: 'freshman',  label: 'Freshman',  emoji: '🌱' },
        { value: 'sophomore', label: 'Sophomore', emoji: '📖' },
        { value: 'junior',    label: 'Junior',    emoji: '⚡' },
        { value: 'senior',    label: 'Senior',    emoji: '🎓' },
        { value: 'graduate',  label: 'Graduate',  emoji: '🔬' },
      ],
    },
    {
      id: 'hometown', q: "Where are you from?",
      sub: 'Local foundations give away millions — most students never find them.',
      type: 'city-state', required: true,
      isValid: d => d.hometown_city.trim().length > 0 && d.hometown_state.trim().length > 0,
    },
    {
      id: 'citizenship', q: "What's your citizenship status?",
      type: 'buttons', field: 'citizenship', required: true, isValid: d => !!d.citizenship,
      options: [
        { value: 'us_citizen',         label: 'US Citizen',     emoji: '🇺🇸' },
        { value: 'permanent_resident', label: 'Perm. Resident', emoji: '🟢' },
        { value: 'daca',               label: 'DACA',           emoji: '📋' },
        { value: 'international',      label: 'International',  emoji: '🌍' },
      ],
    },
    {
      id: 'heritage', q: "What's your heritage or ethnicity?",
      sub: 'Cultural foundations and professional associations fund specific communities.',
      type: 'text', field: 'heritage', placeholder: 'Latino, Korean-American, Nigerian...',
      required: false, isValid: () => true,
    },
    {
      id: 'flags', q: "Do any of these apply to you?",
      sub: 'Each one unlocks a completely different set of scholarships.',
      type: 'checkboxes', required: false, isValid: () => true,
      options: [
        { field: 'first_gen',       emoji: '🎓', label: 'First-generation student', hint: 'Neither parent has a 4-year degree' },
        { field: 'financial_need',  emoji: '💰', label: 'Financial need',            hint: 'Income-based scholarships are common' },
        { field: 'military_family', emoji: '🎖️', label: 'Military family',           hint: 'Veteran, active duty, or dependent' },
      ],
    },
    {
      id: 'gpa', q: "What's your GPA?",
      sub: 'Many scholarships have a minimum — this helps us filter accurately.',
      type: 'number', field: 'gpa', placeholder: '3.8',
      required: false, isValid: () => true,
    },
    {
      id: 'activities', q: "What are you involved in?",
      sub: 'Sports, debate, volunteering, competitions, leadership — all count.',
      type: 'tags', field: 'activities', placeholder: 'Debate team, Hackathons, Chess club...',
      required: false, isValid: () => true,
    },
    {
      id: 'orgs', q: "Any national organizations?",
      sub: 'DECA, Key Club, FBLA, NHS, HOSA — they have scholarship funds most members never claim.',
      type: 'tags', field: 'national_club_orgs', placeholder: 'Type to search or add your own…',
      suggestions: CLUB_ORG_SUGGESTIONS,
      required: false, isValid: () => true,
    },
    {
      id: 'parent', q: "What does a parent or guardian do?",
      sub: 'Employer funds, union scholarships, and industry grants are massively underused.',
      type: 'parent', required: false, isValid: () => true,
    },
    {
      id: 'goal', q: "What's your career goal?",
      sub: 'Field-specific scholarships follow your career path, not just your major.',
      type: 'text', field: 'career_goal', placeholder: 'Software engineer, pediatrician, teacher...',
      required: false, isValid: () => true,
    },
  ]
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete, onSignIn, user = null }) {
  const [phase, setPhase]         = useState('welcome')
  const [data, setData]           = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY))
      if (draft && draft.name) return { ...INITIAL, ...draft, gpa: draft.gpa ?? '' }
    } catch {}
    return INITIAL
  })
  const [step, setStep]           = useState(0)
  const [animKey, setAnimKey]     = useState(0)
  const [direction, setDirection] = useState('forward')
  const [showConfetti, setShowConfetti] = useState(false)

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const inputRef  = useRef(null)
  const questions = buildQuestions(data)
  const TOTAL     = questions.length
  const q         = questions[step]
  const isLast    = step === TOTAL - 1
  const progress  = phase === 'welcome' ? 0
                  : phase === 'auth'    ? 100
                  : ((step / TOTAL) * 95) + 2

  const update = (key, val) => {
    setData(prev => {
      const next = { ...prev, [key]: val }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  useEffect(() => {
    if (phase !== 'questions') return
    const t = setTimeout(() => inputRef.current?.focus(), 340)
    return () => clearTimeout(t)
  }, [step, phase])

  const goNext = () => {
    if (isLast) {
      if (user) {
        finish(null)
      } else {
        setDirection('forward')
        setAnimKey(k => k + 1)
        setPhase('auth')
      }
      return
    }
    setDirection('forward')
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (phase === 'auth') {
      setDirection('backward')
      setAnimKey(k => k + 1)
      setPhase('questions')
      setStep(TOTAL - 1)
      setAuthError('')
      return
    }
    if (phase === 'signin') {
      setPhase('welcome')
      setAuthError('')
      return
    }
    if (step === 0) {
      setDirection('backward')
      setAnimKey(k => k + 1)
      setPhase('welcome')
      return
    }
    setDirection('backward')
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  const finish = (tokenData) => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setShowConfetti(true)
    setPhase('done')
    const profile = { ...data, gpa: data.gpa ? parseFloat(data.gpa) : null }
    setTimeout(() => {
      if (tokenData) {
        onComplete({ profile, token: tokenData.token, email: tokenData.email })
      } else {
        onComplete({ profile, token: user.token, email: user.email })
      }
    }, 1800)
  }

  const handleSignUp = async () => {
    if (!email || password.length < 8) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAuthError(json.detail || 'Sign up failed. Try a different email.')
        setAuthLoading(false)
        return
      }
      finish({ token: json.token, email: json.email })
    } catch {
      setAuthError('Network error. Please try again.')
      setAuthLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAuthError(json.detail || 'Invalid email or password.')
        setAuthLoading(false)
        return
      }
      onSignIn({ token: json.token, email: json.email, cloudProfile: json.profile })
    } catch {
      setAuthError('Network error. Please try again.')
      setAuthLoading(false)
    }
  }

  const animClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'

  // ── Welcome ──────────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <WelcomeScreen
        onStart={() => { setPhase('questions'); setStep(0) }}
        onSignIn={() => { setPhase('signin'); setAuthError('') }}
      />
    )
  }

  // ── Sign-in ──────────────────────────────────────────────────────────────
  if (phase === 'signin') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 pt-8 flex-shrink-0">
          <Logo onClick={() => { setPhase('welcome'); setAuthError('') }} />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-2xl animate-slide-in-right">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-3">Welcome back! 👋</h2>
            <p className="text-base text-gray-400 mb-10">Sign in to pick up where you left off.</p>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoFocus
                  className="w-full text-2xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 mt-2 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  onKeyDown={e => e.key === 'Enter' && !authLoading && handleSignIn()}
                  className="w-full text-2xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 mt-2 transition-colors"
                />
              </div>
            </div>
            {authError && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{authError}</p>
            )}
            <div className="flex items-center justify-between mt-10">
              <button onClick={() => { setPhase('welcome'); setAuthError('') }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← New here? Get started
              </button>
              <button
                onClick={handleSignIn}
                disabled={authLoading || !email || !password}
                className={`px-7 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  !authLoading && email && password
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {authLoading ? 'Signing in…' : 'Sign In →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const first = data.name.split(' ')[0] || 'there'
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
        {showConfetti && <Confetti />}
        <div className="animate-pop-in">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">You're all set, {first}!</h1>
          <p className="text-lg text-gray-400">Starting your scholarship search now…</p>
        </div>
      </div>
    )
  }

  // ── Auth step ────────────────────────────────────────────────────────────
  if (phase === 'auth') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-20" />
        <div className="px-6 pt-8 flex-shrink-0">
          <Logo onClick={goBack} />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-2xl animate-slide-in-right">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-3">One last step. 🔒</h2>
            <p className="text-base text-gray-400 mb-10">Create a free account to save your results and search again anytime.</p>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoFocus
                  className="w-full text-2xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 mt-2 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  onKeyDown={e => e.key === 'Enter' && !authLoading && handleSignUp()}
                  className="w-full text-2xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 mt-2 transition-colors"
                />
              </div>
            </div>
            {authError && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{authError}</p>
            )}
            <div className="flex items-center justify-between mt-10">
              <button onClick={() => { setPhase('signin'); setAuthError('') }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Already have an account? Sign in →
              </button>
              <button
                onClick={handleSignUp}
                disabled={authLoading || !email || password.length < 8}
                className={`px-7 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  !authLoading && email && password.length >= 8
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {authLoading ? 'Creating account…' : 'Find My Scholarships 🚀'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Questions ────────────────────────────────────────────────────────────
  const canContinue = !q.required || q.isValid(data)

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey && q?.type !== 'checkboxes' && q?.type !== 'buttons') {
          if (!q.required || q.isValid(data)) { e.preventDefault(); goNext() }
        }
      }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-20">
        <div className="h-1 bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Top nav */}
      <div className="flex items-center justify-between px-6 pt-8 pb-0 flex-shrink-0">
        <Logo onClick={goBack} />
        <span className="text-sm text-gray-300 tabular-nums">{step + 1} / {TOTAL}</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div key={animKey} className={`w-full max-w-2xl ${animClass}`}>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-3">{q.q}</h2>
          {q.sub && <p className="text-base text-gray-400 mb-10 leading-relaxed max-w-lg">{q.sub}</p>}

          {q.type === 'text' && (
            <input
              ref={inputRef} type="text" value={data[q.field] || ''}
              onChange={e => update(q.field, e.target.value)}
              placeholder={q.placeholder} autoComplete="off"
              className="w-full text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
            />
          )}

          {q.type === 'number' && (
            <input
              ref={inputRef} type="number" step="0.01" min="0" max="4.0"
              value={data[q.field] || ''} onChange={e => update(q.field, e.target.value)}
              placeholder={q.placeholder}
              className="w-48 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
            />
          )}

          {q.type === 'city-state' && (
            <div className="flex gap-5 items-end">
              <input
                ref={inputRef} type="text" value={data.hometown_city}
                onChange={e => update('hometown_city', e.target.value)}
                placeholder="City"
                className="flex-1 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
              />
              <input
                type="text" value={data.hometown_state}
                onChange={e => update('hometown_state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="ST" maxLength={2}
                className="w-20 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 text-center transition-colors duration-200 uppercase tracking-widest"
              />
            </div>
          )}

          {q.type === 'buttons' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { update(q.field, opt.value); setTimeout(goNext, 260) }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                    data[q.field] === opt.value
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <span className="text-3xl block mb-2">{opt.emoji}</span>
                  <span className={`font-semibold text-sm ${data[q.field] === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {q.type === 'checkboxes' && (
            <div className="space-y-3 mt-2">
              {q.options.map(opt => (
                <button
                  key={opt.field} type="button"
                  onClick={() => update(opt.field, !data[opt.field])}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-150 ${
                    data[opt.field]
                      ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${data[opt.field] ? 'text-blue-700' : 'text-gray-800'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.hint}</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    data[opt.field] ? 'bg-blue-500 border-blue-500 scale-110' : 'border-gray-300'
                  }`}>
                    {data[opt.field] && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {q.type === 'tags' && (
            <TagInput value={data[q.field] || []} onChange={val => update(q.field, val)}
              placeholder={q.placeholder} inputRef={inputRef} suggestions={q.suggestions || []} />
          )}

          {q.type === 'parent' && (
            <div className="space-y-6">
              {[
                { key: 'parent_employer', label: 'Employer', placeholder: 'NYC Dept of Education, Boeing...' },
                { key: 'parent_industry', label: 'Industry',  placeholder: 'Education, Healthcare, Construction...' },
                { key: 'parent_union',    label: 'Union',     placeholder: 'UFT, SEIU, Teamsters...' },
              ].map(({ key, label, placeholder }, i) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</label>
                  <input
                    ref={i === 0 ? inputRef : undefined}
                    type="text" value={data[key]} onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full text-xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 mt-2 transition-colors duration-200"
                  />
                </div>
              ))}
            </div>
          )}

          {q.type !== 'buttons' && (
            <div className="flex items-center justify-between mt-12">
              {!q.required ? (
                <button onClick={goNext} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Skip for now →
                </button>
              ) : <div />}
              <div className="flex items-center gap-4">
                {(q.type === 'text' || q.type === 'number' || q.type === 'city-state') && canContinue && (
                  <span className="text-xs text-gray-300 hidden sm:block">
                    press <kbd className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono text-xs">Enter ↵</kbd>
                  </span>
                )}
                <button
                  onClick={goNext}
                  disabled={q.required && !canContinue}
                  className={`px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                    !q.required || canContinue
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLast ? 'Almost done →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
