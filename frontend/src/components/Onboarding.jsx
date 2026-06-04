import { useState, useEffect, useRef } from 'react'

const DRAFT_KEY = 'sm_form_draft'

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

// ── TagInput ──────────────────────────────────────────────────────────────────
function TagInput({ value = [], onChange, placeholder, inputRef }) {
  const [text, setText] = useState('')
  const commit = () => {
    const tag = text.trim().replace(/,+$/, '')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setText('')
  }
  return (
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
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : 'Add more...'}
      />
    </div>
  )
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${(i / 70) * 100 + (i % 3 - 1) * 3}%`,
    delay: `${(i * 0.018) % 0.9}s`,
    width: `${5 + (i % 5) * 2}px`,
    height: `${8 + (i % 4) * 3}px`,
    duration: `${1.2 + (i % 5) * 0.2}s`,
    rotate: i % 2 === 0 ? '0deg' : '45deg',
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          backgroundColor: p.color,
          left: p.left,
          top: '-14px',
          width: p.width,
          height: p.height,
          borderRadius: '2px',
          transform: `rotate(${p.rotate})`,
          animation: `confettiFall ${p.duration} ease-in ${p.delay} forwards`,
        }} />
      ))}
    </div>
  )
}

// ── Question definitions ──────────────────────────────────────────────────────
function buildQuestions(data) {
  const first = data.name.split(' ')[0] || ''
  return [
    {
      id: 'name',
      q: "What's your name?",
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
      id: 'major',
      q: "What are you studying?",
      sub: 'Professional associations in your field fund thousands of scholarships.',
      type: 'text', field: 'major', placeholder: 'Computer Science',
      required: true, isValid: d => d.major.trim().length > 1,
    },
    {
      id: 'year',
      q: "What year are you in?",
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
      id: 'hometown',
      q: "Where are you from?",
      sub: 'Local foundations give away millions — most students never find them.',
      type: 'city-state', required: true,
      isValid: d => d.hometown_city.trim().length > 0 && d.hometown_state.trim().length > 0,
    },
    {
      id: 'citizenship',
      q: "What's your citizenship status?",
      type: 'buttons', field: 'citizenship', required: true, isValid: d => !!d.citizenship,
      options: [
        { value: 'us_citizen',          label: 'US Citizen',       emoji: '🇺🇸' },
        { value: 'permanent_resident',  label: 'Perm. Resident',   emoji: '🟢' },
        { value: 'daca',                label: 'DACA',             emoji: '📋' },
        { value: 'international',       label: 'International',    emoji: '🌍' },
      ],
    },
    {
      id: 'heritage',
      q: "What's your heritage or ethnicity?",
      sub: 'Cultural foundations and professional associations fund specific communities.',
      type: 'text', field: 'heritage', placeholder: 'Latino, Korean-American, Nigerian...',
      required: false, isValid: () => true,
    },
    {
      id: 'flags',
      q: "Do any of these apply to you?",
      sub: 'Each one unlocks a completely different set of scholarships.',
      type: 'checkboxes', required: false, isValid: () => true,
      options: [
        { field: 'first_gen',      emoji: '🎓', label: 'First-generation student',  hint: 'Neither parent has a 4-year degree' },
        { field: 'financial_need', emoji: '💰', label: 'Financial need',             hint: 'Income-based scholarships are common' },
        { field: 'military_family',emoji: '🎖️', label: 'Military family',            hint: 'Veteran, active duty, or dependent' },
      ],
    },
    {
      id: 'gpa',
      q: "What's your GPA?",
      sub: 'Many scholarships have a minimum — this helps us filter accurately.',
      type: 'number', field: 'gpa', placeholder: '3.8',
      required: false, isValid: () => true,
    },
    {
      id: 'activities',
      q: "What are you involved in?",
      sub: 'Sports, debate, volunteering, competitions, leadership — all count.',
      type: 'tags', field: 'activities', placeholder: 'Debate team, Hackathons, Chess club...',
      required: false, isValid: () => true,
    },
    {
      id: 'orgs',
      q: "Any national organizations?",
      sub: 'DECA, Key Club, FBLA, NHS, HOSA — they have scholarship funds most members never claim.',
      type: 'tags', field: 'national_club_orgs', placeholder: 'DECA, Key Club, NHS...',
      required: false, isValid: () => true,
    },
    {
      id: 'parent',
      q: "What does a parent or guardian do?",
      sub: 'Employer funds, union scholarships, and industry grants are massively underused.',
      type: 'parent', required: false, isValid: () => true,
    },
    {
      id: 'goal',
      q: "What's your career goal?",
      sub: 'Field-specific scholarships follow your career path, not just your major.',
      type: 'text', field: 'career_goal', placeholder: 'Software engineer, pediatrician, teacher...',
      required: false, isValid: () => true,
    },
  ]
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Onboarding({ onSubmit, onBack }) {
  const [data, setData] = useState(() => {
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
  const [done, setDone]           = useState(false)
  const inputRef                  = useRef(null)

  const questions = buildQuestions(data)
  const TOTAL     = questions.length
  const q         = questions[step]
  const progress  = (step / TOTAL) * 100
  const isLast    = step === TOTAL - 1

  const update = (key, val) => {
    setData(prev => {
      const next = { ...prev, [key]: val }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const goNext = () => {
    if (isLast) {
      finish()
      return
    }
    setDirection('forward')
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (step === 0) { onBack(); return }
    setDirection('backward')
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  const finish = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setShowConfetti(true)
    setDone(true)
    setTimeout(() => {
      onSubmit({ ...data, gpa: data.gpa ? parseFloat(data.gpa) : null })
    }, 1800)
  }

  // Focus input when step changes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 340)
    return () => clearTimeout(t)
  }, [step])

  // Keyboard: Enter to advance
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && q?.type !== 'checkboxes' && q?.type !== 'buttons') {
      if (!q.required || q.isValid(data)) {
        e.preventDefault()
        goNext()
      }
    }
  }

  const animClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'

  // ── Done screen ──────────────────────────────────────────────────────────
  if (done) {
    const first = data.name.split(' ')[0] || 'there'
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
        {showConfetti && <Confetti />}
        <div className="animate-pop-in">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            You're all set, {first}!
          </h1>
          <p className="text-lg text-gray-400">Starting your scholarship search now…</p>
        </div>
      </div>
    )
  }

  const canContinue = !q.required || q.isValid(data)

  return (
    <div className="min-h-screen bg-white flex flex-col" onKeyDown={handleKeyDown}>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-20">
        <div
          className="h-1 bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top nav */}
      <div className="flex items-center justify-between px-6 pt-8 pb-0 flex-shrink-0">
        <button
          onClick={goBack}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          ← {step === 0 ? 'Back' : 'Previous'}
        </button>
        <span className="text-sm font-semibold text-blue-500">ScholarMatch</span>
        <span className="text-sm text-gray-300 tabular-nums">{step + 1} / {TOTAL}</span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div key={animKey} className={`w-full max-w-2xl ${animClass}`}>

          {/* Question */}
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-3">
            {q.q}
          </h2>
          {q.sub && (
            <p className="text-base text-gray-400 mb-10 leading-relaxed max-w-lg">
              {q.sub}
            </p>
          )}

          {/* ── Inputs ── */}

          {(q.type === 'text') && (
            <input
              ref={inputRef}
              type="text"
              value={data[q.field] || ''}
              onChange={e => update(q.field, e.target.value)}
              placeholder={q.placeholder}
              autoComplete="off"
              className="w-full text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
            />
          )}

          {q.type === 'number' && (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              value={data[q.field] || ''}
              onChange={e => update(q.field, e.target.value)}
              placeholder={q.placeholder}
              className="w-48 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
            />
          )}

          {q.type === 'city-state' && (
            <div className="flex gap-5 items-end">
              <input
                ref={inputRef}
                type="text"
                value={data.hometown_city}
                onChange={e => update('hometown_city', e.target.value)}
                placeholder="City"
                className="flex-1 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 transition-colors duration-200"
              />
              <input
                type="text"
                value={data.hometown_state}
                onChange={e => update('hometown_state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="ST"
                maxLength={2}
                className="w-20 text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 text-center transition-colors duration-200 uppercase tracking-widest"
              />
            </div>
          )}

          {q.type === 'buttons' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    update(q.field, opt.value)
                    setTimeout(goNext, 260)
                  }}
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
                  key={opt.field}
                  type="button"
                  onClick={() => update(opt.field, !data[opt.field])}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-150 ${
                    data[opt.field]
                      ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${data[opt.field] ? 'text-blue-700' : 'text-gray-800'}`}>
                      {opt.label}
                    </p>
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
            <TagInput
              value={data[q.field] || []}
              onChange={val => update(q.field, val)}
              placeholder={q.placeholder}
              inputRef={inputRef}
            />
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
                    type="text"
                    value={data[key]}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full text-xl font-light text-gray-900 placeholder-gray-300 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 mt-2 transition-colors duration-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Action row ── */}
          {q.type !== 'buttons' && (
            <div className="flex items-center justify-between mt-12">
              {!q.required ? (
                <button
                  onClick={goNext}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
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
                  {isLast ? 'Find My Scholarships 🚀' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
