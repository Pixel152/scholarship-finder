import { useEffect, useRef, useState } from 'react'
import ImportModal from './ImportModal'

// National organizations with documented scholarship programs — used for autocomplete
const CLUB_ORG_SUGGESTIONS = [
  '4-H',
  'FFA (Future Farmers of America)',
  'DECA',
  'FBLA (Future Business Leaders of America)',
  'FCCLA',
  'HOSA (Health Occupations Students of America)',
  'Key Club International',
  'National Honor Society (NHS)',
  'National Beta Club',
  'SkillsUSA',
  'Technology Student Association (TSA)',
  'Eagle Scout / Boy Scouts of America',
  'Girl Scouts Gold Award',
  'Rotary International / Interact Club',
  'FIRST Robotics',
  'Science Olympiad',
  'NSDA / Speech and Debate',
  'Academic Decathlon',
  'MATHCOUNTS',
  'Odyssey of the Mind',
  'Civil Air Patrol (CAP)',
  'JROTC',
  'Junior Achievement (JA)',
  'YMCA Youth & Government',
  'Phi Theta Kappa (PTK)',
  'Student Council / SGA',
  'Model United Nations (MUN)',
  'American Legion / Sons of the American Legion',
  'Elks Lodge (BPOE)',
  'Jack and Jill of America',
  'NAACP Youth Council',
  'National FFA Organization',
  'Junior State of America (JSA)',
  'Future Problem Solving Program (FPSP)',
]

const STEPS = [
  { title: 'About You', subtitle: 'Basic academic information' },
  { title: "Where You're From", subtitle: 'Location unlocks local & regional scholarships' },
  { title: 'Identity & Background', subtitle: 'Heritage, flags, and affiliations' },
  { title: 'Family & Goals', subtitle: 'Parent background and career aims' },
]

const INITIAL = {
  name: '', year: '', university: '', major: '', gpa: '', intended_profession: '',
  hometown_city: '', hometown_state: '', hometown_county: '', state_of_residence: '',
  high_school: '', high_school_state: '',
  citizenship: 'us_citizen', heritage: '', religion: '', languages: [],
  first_gen: false, financial_need: false, income_bracket: '', military_family: false, disability: '',
  activities: [], national_club_orgs: [], honors: [],
  parent_employer: '', parent_industry: '', parent_union: '',
  career_goal: '', already_applied: [],
}

function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState('')

  const commit = () => {
    const tag = text.trim().replace(/,+$/, '')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setText('')
  }

  return (
    <div className="border border-gray-300 rounded-lg p-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white min-h-[44px]">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-sm px-2.5 py-0.5 rounded-full border border-blue-200">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(t => t !== tag))}
              className="text-blue-400 hover:text-blue-700 font-bold leading-none ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
          if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : 'Add another...'}
      />
    </div>
  )
}

// TagInput with autocomplete dropdown — used for national_club_orgs
function TagInputWithSuggestions({ value, onChange, placeholder, suggestions }) {
  const [text,      setText]      = useState('')
  const [open,      setOpen]      = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)

  const filtered = text.trim().length > 0
    ? suggestions.filter(s =>
        s.toLowerCase().includes(text.toLowerCase()) &&
        !value.includes(s)
      ).slice(0, 7)
    : []

  const commit = (tag) => {
    const t = (tag || text).trim().replace(/,+$/, '')
    if (t && !value.includes(t)) onChange([...value, t])
    setText('')
    setOpen(false)
    setActiveIdx(-1)
  }

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showDropdown = open && filtered.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="border border-gray-300 rounded-lg p-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white min-h-[44px]">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {value.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-sm px-2.5 py-0.5 rounded-full border border-blue-200">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter(t => t !== tag))}
                className="text-blue-400 hover:text-blue-700 font-bold leading-none ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          value={text}
          onChange={e => { setText(e.target.value); setOpen(true); setActiveIdx(-1) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIdx(i => Math.max(i - 1, -1))
            } else if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              if (activeIdx >= 0 && filtered[activeIdx]) {
                commit(filtered[activeIdx])
              } else {
                commit()
              }
            } else if (e.key === 'Escape') {
              setOpen(false); setActiveIdx(-1)
            } else if (e.key === 'Backspace' && !text && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); setActiveIdx(-1) }, 150)}
          placeholder={value.length === 0 ? placeholder : 'Add another…'}
        />
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium">Suggested organizations</span>
          </div>
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => commit(s)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                i === activeIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
          {text.trim() && !suggestions.some(s => s.toLowerCase() === text.trim().toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => commit(text.trim())}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors"
            >
              Add "<span className="font-medium text-gray-700">{text.trim()}</span>"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${checked ? 'bg-blue-600' : 'bg-gray-200 group-hover:bg-gray-300'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </label>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5 normal-case">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1.5 normal-case text-xs tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300 bg-white transition-all duration-150 hover:border-gray-300"
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-150 hover:border-gray-300 appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Step1({ data, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Full name" required>
        <Input value={data.name} onChange={v => update('name', v)} placeholder="Alex Johnson" />
      </Field>
      <Field label="Year in school" required>
        <Select value={data.year} onChange={v => update('year', v)} options={[
          { value: '', label: 'Select year…' },
          { value: 'freshman', label: 'Freshman' },
          { value: 'sophomore', label: 'Sophomore' },
          { value: 'junior', label: 'Junior' },
          { value: 'senior', label: 'Senior' },
          { value: 'graduate', label: 'Graduate' },
        ]} />
      </Field>
      <Field label="University / College" required>
        <Input value={data.university} onChange={v => update('university', v)} placeholder="Columbia University" />
      </Field>
      <Field label="Major" required>
        <Input value={data.major} onChange={v => update('major', v)} placeholder="Computer Science" />
      </Field>
      <Field label="GPA" hint="optional">
        <Input type="number" value={data.gpa} onChange={v => update('gpa', v)} placeholder="3.7" />
      </Field>
      <Field label="Intended profession" hint="optional">
        <Input value={data.intended_profession} onChange={v => update('intended_profession', v)} placeholder="Software engineer, doctor, lawyer…" />
      </Field>
    </div>
  )
}

function Step2({ data, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Hometown city" required>
        <Input value={data.hometown_city} onChange={v => update('hometown_city', v)} placeholder="New York" />
      </Field>
      <Field label="Hometown state" required>
        <Input value={data.hometown_state} onChange={v => update('hometown_state', v)} placeholder="NY" />
      </Field>
      <Field label="Hometown county" hint="unlocks county-level foundations">
        <Input value={data.hometown_county} onChange={v => update('hometown_county', v)} placeholder="Kings County" />
      </Field>
      <Field label="Current state of residence" hint="if different from hometown">
        <Input value={data.state_of_residence} onChange={v => update('state_of_residence', v)} placeholder="CA" />
      </Field>
      <Field label="High school name" hint="alumni orgs give scholarships after graduation">
        <Input value={data.high_school} onChange={v => update('high_school', v)} placeholder="Stuyvesant High School" />
      </Field>
      <Field label="High school state" hint="optional">
        <Input value={data.high_school_state} onChange={v => update('high_school_state', v)} placeholder="NY" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Citizenship status" required>
          <Select value={data.citizenship} onChange={v => update('citizenship', v)} options={[
            { value: 'us_citizen', label: 'US Citizen' },
            { value: 'permanent_resident', label: 'Permanent Resident' },
            { value: 'daca', label: 'DACA' },
            { value: 'international', label: 'International Student' },
          ]} />
        </Field>
      </div>
    </div>
  )
}

function Step3({ data, update }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Heritage / Ethnicity" hint="optional">
          <Input value={data.heritage} onChange={v => update('heritage', v)} placeholder="Israeli-American, Chinese, Irish…" />
        </Field>
        <Field label="Religious affiliation" hint="optional">
          <Input value={data.religion} onChange={v => update('religion', v)} placeholder="Jewish, Catholic, Muslim…" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Languages spoken besides English" hint="press Enter after each">
            <TagInput value={data.languages} onChange={v => update('languages', v)} placeholder="Spanish, Hebrew, Mandarin…" />
          </Field>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
        <p className="text-sm font-semibold text-gray-700">Background flags</p>
        <Toggle
          checked={data.first_gen}
          onChange={v => update('first_gen', v)}
          label="First-generation college student"
          hint="Neither parent completed a 4-year degree"
        />
        <Toggle
          checked={data.financial_need}
          onChange={v => update('financial_need', v)}
          label="Demonstrated financial need"
        />
        <Toggle
          checked={data.military_family}
          onChange={v => update('military_family', v)}
          label="Military family"
          hint="Parent or guardian served in US military"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Household income bracket" hint="for need-based thresholds">
          <Select value={data.income_bracket} onChange={v => update('income_bracket', v)} options={[
            { value: '', label: 'Prefer not to say' },
            { value: 'under $50K', label: 'Under $50,000' },
            { value: '$50-100K', label: '$50,000 – $100,000' },
            { value: '$100K+', label: 'Over $100,000' },
          ]} />
        </Field>
        <Field label="Disability" hint="optional">
          <Input value={data.disability} onChange={v => update('disability', v)} placeholder="Visual impairment, ADHD…" />
        </Field>
      </div>
    </div>
  )
}

function Step4({ data, update }) {
  return (
    <div className="space-y-5">
      <Field label="Activities, clubs, sports" hint="press Enter after each">
        <TagInput value={data.activities} onChange={v => update('activities', v)} placeholder="Tennis, debate club, student government…" />
      </Field>

      <Field
        label="National club organizations"
        hint="Key Club, DECA, FBLA, HOSA, 4-H, Rotaract — each has its own scholarship fund"
      >
        <TagInputWithSuggestions
          value={data.national_club_orgs}
          onChange={v => update('national_club_orgs', v)}
          placeholder="Type an org name or pick from suggestions…"
          suggestions={CLUB_ORG_SUGGESTIONS}
        />
      </Field>

      <Field label="Academic honors & awards" hint="National Merit, AP Scholar, valedictorian…">
        <TagInput value={data.honors} onChange={v => update('honors', v)} placeholder="National Merit Finalist, AP Scholar…" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        <Field label="Parent's employer" hint="many companies run dependent scholarships">
          <Input value={data.parent_employer} onChange={v => update('parent_employer', v)} placeholder="Google, City of New York…" />
        </Field>
        <Field label="Parent's industry" hint="trade associations give by industry">
          <Input value={data.parent_industry} onChange={v => update('parent_industry', v)} placeholder="Construction, healthcare, education…" />
        </Field>
        <Field label="Parent's union" hint="union education funds are nearly invisible online">
          <Input value={data.parent_union} onChange={v => update('parent_union', v)} placeholder="AFL-CIO, SEIU, teachers union…" />
        </Field>
        <Field label="Career goal" hint="optional">
          <Input value={data.career_goal} onChange={v => update('career_goal', v)} placeholder="Venture capital, medicine…" />
        </Field>
      </div>

      <Field label="Scholarships already applied to" hint="we'll skip these">
        <TagInput value={data.already_applied} onChange={v => update('already_applied', v)} placeholder="Gates Scholarship, Coca-Cola Scholars…" />
      </Field>
    </div>
  )
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4]

function isStepValid(step, data) {
  if (step === 0) return data.name.trim() && data.year && data.university.trim() && data.major.trim()
  if (step === 1) return data.hometown_city.trim() && data.hometown_state.trim() && data.citizenship
  return true
}

const DRAFT_KEY = 'sm_form_draft'

export default function MultiStepForm({ onSubmit, onBack, onImportReview, initialData = null, editMode = false }) {
  const [step,        setStep]        = useState(0)
  const [showImport,  setShowImport]  = useState(false)
  const [data, setData] = useState(() => {
    if (initialData) return { ...INITIAL, ...initialData, gpa: initialData.gpa ?? '' }
    if (!editMode) {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY))
        if (draft) return { ...INITIAL, ...draft }
      } catch {}
    }
    return INITIAL
  })

  const update = (key, val) => setData(prev => {
    const next = { ...prev, [key]: val }
    if (!editMode) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
    }
    return next
  })
  const StepComponent = STEP_COMPONENTS[step]
  const valid = isStepValid(step, data)
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (!valid) return
    if (isLast) {
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      onSubmit({ ...data, gpa: data.gpa ? parseFloat(data.gpa) : null })
    } else {
      setStep(s => s + 1)
    }
  }

  const handleImport = ({ profile, warnings }) => {
    if (onImportReview) {
      onImportReview({ profile, warnings, currentData: { ...data, gpa: data.gpa ? parseFloat(data.gpa) : null } })
    }
  }

  return (
    <>
      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
      <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <span className="text-blue-600 font-bold text-sm">ScholarMatch</span>
        <span className="text-sm text-gray-400">{editMode ? 'Edit Profile · ' : ''}Step {step + 1} of {STEPS.length}</span>
      </div>

      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-blue-600 transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Import button — shown on first step only */}
          {step === 0 && (
            <button
              onClick={() => setShowImport(true)}
              className="w-full mb-5 py-2.5 rounded-xl border border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import from resume or document
            </button>
          )}

          <div className="mb-7">
            {editMode && step === 0 && (
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Editing Profile</p>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{STEPS[step].title}</h2>
            <p className="text-gray-500 mt-1 text-sm">{STEPS[step].subtitle}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 md:p-8 animate-scale-in">
            <StepComponent data={data} update={update} />
          </div>

          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!valid}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                valid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLast ? (editMode ? 'Save Profile ✓' : 'Find My Scholarships →') : 'Continue →'}
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 h-2 bg-blue-600' : i < step ? 'w-2 h-2 bg-blue-300' : 'w-2 h-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
