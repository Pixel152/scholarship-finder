import { useState } from 'react'

// ─── Field definitions ────────────────────────────────────────────────────────

const CITIZENSHIP_OPTIONS = [
  { value: 'us_citizen',          label: 'US Citizen' },
  { value: 'permanent_resident',  label: 'Permanent Resident' },
  { value: 'daca',                label: 'DACA' },
  { value: 'international',       label: 'International' },
]

const YEAR_OPTIONS = [
  { value: 'freshman',  label: 'Freshman'  },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior',    label: 'Junior'    },
  { value: 'senior',    label: 'Senior'    },
  { value: 'graduate',  label: 'Graduate'  },
]

const INCOME_OPTIONS = [
  { value: 'under_30k',    label: 'Under $30k'    },
  { value: '30k_60k',      label: '$30k – $60k'   },
  { value: '60k_100k',     label: '$60k – $100k'  },
  { value: 'over_100k',    label: 'Over $100k'    },
]

// ─── Small input components ───────────────────────────────────────────────────

function FieldWrap({ label, isNew, children }) {
  return (
    <div className={`rounded-xl p-3 transition-colors ${isNew ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        {isNew && (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200 leading-none">
            NEW
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-300"
const selectCls = `${inputCls} appearance-none cursor-pointer`

function TextInput({ value, onChange, placeholder }) {
  return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} className={inputCls} />
}

function SelectInput({ value, onChange, options }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={selectCls}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function TagInput({ values = [], onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = (val) => {
    const v = val.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  const remove = (i) => onChange(values.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
            {v}
            <button onClick={() => remove(i)} className="text-gray-400 hover:text-gray-600 leading-none ml-0.5">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={placeholder || 'Type and press Enter…'}
        className={inputCls}
      />
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function FullWidth({ children }) {
  return <div className="sm:col-span-2">{children}</div>
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportReviewPage({ initialProfile, currentProfile, importedKeys, onSave, onCancel }) {
  // Merge: imported fields on top of current, but start editable
  const [data, setData] = useState(() => {
    const merged = { ...currentProfile }
    for (const key of importedKeys) {
      const imported = initialProfile[key]
      const existing = currentProfile?.[key]
      if (Array.isArray(imported)) {
        // Merge arrays, deduplicate case-insensitively
        const base = Array.isArray(existing) ? existing : []
        const baseLower = base.map(v => v.toLowerCase())
        const newItems = imported.filter(v => !baseLower.includes(v.toLowerCase()))
        merged[key] = [...base, ...newItems]
      } else {
        // Only fill if current value is empty/falsy
        const isEmpty = existing === null || existing === undefined || existing === '' || existing === false
        if (isEmpty) merged[key] = imported
      }
    }
    // GPA: only fill if not already set
    if (!currentProfile?.gpa && initialProfile.gpa) merged.gpa = initialProfile.gpa
    else merged.gpa = currentProfile?.gpa ?? ''
    return merged
  })

  const set = (key) => (val) => setData(prev => ({ ...prev, [key]: val }))

  // A field is "new" only if it was truly empty before import or had new array items added
  const isNew = (key) => {
    if (!importedKeys.includes(key)) return false
    const existing = currentProfile?.[key]
    if (Array.isArray(existing)) {
      const imported = initialProfile[key] || []
      const baseLower = existing.map(v => v.toLowerCase())
      return imported.some(v => !baseLower.includes(v.toLowerCase()))
    }
    return existing === null || existing === undefined || existing === '' || existing === false
  }

  const newCount = importedKeys.filter(k => {
    const v = data[k]
    if (Array.isArray(v)) return v.length > 0
    return v !== null && v !== undefined && v !== '' && v !== false
  }).length

  const handleSave = () => {
    onSave({ ...data, gpa: data.gpa ? parseFloat(data.gpa) : null })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancel
          </button>
          <div className="text-center">
            <h1 className="font-bold text-gray-900 text-sm">Review imported profile</h1>
            <p className="text-xs text-gray-400">{newCount} field{newCount !== 1 ? 's' : ''} highlighted in yellow</p>
          </div>
          <button onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm flex-shrink-0">
            Save →
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        {/* Legend */}
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            NEW
          </span>
          <span>= found in your document · all fields are editable</span>
        </div>

        {/* ── Basic ── */}
        <Section title="Basic" icon="👤">
          <FullWidth>
            <FieldWrap label="Full name" isNew={isNew('name')}>
              <TextInput value={data.name} onChange={set('name')} placeholder="Your full name" />
            </FieldWrap>
          </FullWidth>
        </Section>

        {/* ── Academic ── */}
        <Section title="Academic" icon="🎓">
          <FullWidth>
            <FieldWrap label="University" isNew={isNew('university')}>
              <TextInput value={data.university} onChange={set('university')} placeholder="University name" />
            </FieldWrap>
          </FullWidth>
          <FieldWrap label="Major" isNew={isNew('major')}>
            <TextInput value={data.major} onChange={set('major')} placeholder="Field of study" />
          </FieldWrap>
          <FieldWrap label="Year" isNew={isNew('year')}>
            <SelectInput value={data.year} onChange={set('year')} options={YEAR_OPTIONS} />
          </FieldWrap>
          <FieldWrap label="GPA" isNew={isNew('gpa')}>
            <input type="number" step="0.01" min="0" max="4.0"
              value={data.gpa || ''} onChange={e => set('gpa')(e.target.value)}
              placeholder="e.g. 3.7" className={inputCls} />
          </FieldWrap>
          <FieldWrap label="Intended profession" isNew={isNew('intended_profession')}>
            <TextInput value={data.intended_profession} onChange={set('intended_profession')} placeholder="e.g. Engineer, Nurse" />
          </FieldWrap>
          <FullWidth>
            <FieldWrap label="Career goal" isNew={isNew('career_goal')}>
              <TextInput value={data.career_goal} onChange={set('career_goal')} placeholder="What do you want to do?" />
            </FieldWrap>
          </FullWidth>
        </Section>

        {/* ── Location ── */}
        <Section title="Location" icon="📍">
          <FieldWrap label="Hometown city" isNew={isNew('hometown_city')}>
            <TextInput value={data.hometown_city} onChange={set('hometown_city')} placeholder="City" />
          </FieldWrap>
          <FieldWrap label="Hometown state" isNew={isNew('hometown_state')}>
            <TextInput value={data.hometown_state} onChange={set('hometown_state')} placeholder="e.g. CA" />
          </FieldWrap>
          <FieldWrap label="County" isNew={isNew('hometown_county')}>
            <TextInput value={data.hometown_county} onChange={set('hometown_county')} placeholder="County name" />
          </FieldWrap>
          <FieldWrap label="High school" isNew={isNew('high_school')}>
            <TextInput value={data.high_school} onChange={set('high_school')} placeholder="High school name" />
          </FieldWrap>
          <FullWidth>
            <FieldWrap label="Citizenship" isNew={isNew('citizenship')}>
              <SelectInput value={data.citizenship} onChange={set('citizenship')} options={CITIZENSHIP_OPTIONS} />
            </FieldWrap>
          </FullWidth>
        </Section>

        {/* ── Identity ── */}
        <Section title="Identity" icon="🌍">
          <FieldWrap label="Heritage / ethnicity" isNew={isNew('heritage')}>
            <TextInput value={data.heritage} onChange={set('heritage')} placeholder="e.g. Mexican-American" />
          </FieldWrap>
          <FieldWrap label="Religion" isNew={isNew('religion')}>
            <TextInput value={data.religion} onChange={set('religion')} placeholder="Optional" />
          </FieldWrap>
          <FullWidth>
            <FieldWrap label="Languages spoken" isNew={isNew('languages')}>
              <TagInput values={data.languages} onChange={set('languages')} placeholder="e.g. Spanish, Mandarin" />
            </FieldWrap>
          </FullWidth>
          <FullWidth>
            <FieldWrap label="Income bracket" isNew={isNew('income_bracket')}>
              <SelectInput value={data.income_bracket} onChange={set('income_bracket')} options={INCOME_OPTIONS} />
            </FieldWrap>
          </FullWidth>
          <FieldWrap label="First-generation student" isNew={isNew('first_gen')}>
            <div className="flex items-center gap-3 py-1">
              <Toggle value={data.first_gen} onChange={set('first_gen')} />
              <span className="text-sm text-gray-600">{data.first_gen ? 'Yes' : 'No'}</span>
            </div>
          </FieldWrap>
          <FieldWrap label="Financial need" isNew={isNew('financial_need')}>
            <div className="flex items-center gap-3 py-1">
              <Toggle value={data.financial_need} onChange={set('financial_need')} />
              <span className="text-sm text-gray-600">{data.financial_need ? 'Yes' : 'No'}</span>
            </div>
          </FieldWrap>
          <FieldWrap label="Military family" isNew={isNew('military_family')}>
            <div className="flex items-center gap-3 py-1">
              <Toggle value={data.military_family} onChange={set('military_family')} />
              <span className="text-sm text-gray-600">{data.military_family ? 'Yes' : 'No'}</span>
            </div>
          </FieldWrap>
        </Section>

        {/* ── Affiliations ── */}
        <Section title="Affiliations" icon="🤝">
          <FullWidth>
            <FieldWrap label="Activities & sports" isNew={isNew('activities')}>
              <TagInput values={data.activities} onChange={set('activities')} placeholder="e.g. Soccer, Debate team" />
            </FieldWrap>
          </FullWidth>
          <FullWidth>
            <FieldWrap label="National club orgs" isNew={isNew('national_club_orgs')}>
              <TagInput values={data.national_club_orgs} onChange={set('national_club_orgs')} placeholder="e.g. DECA, Key Club" />
            </FieldWrap>
          </FullWidth>
          <FullWidth>
            <FieldWrap label="Honors & awards" isNew={isNew('honors')}>
              <TagInput values={data.honors} onChange={set('honors')} placeholder="e.g. National Merit Semifinalist" />
            </FieldWrap>
          </FullWidth>
        </Section>

        {/* ── Family ── */}
        <Section title="Family background" icon="👨‍👩‍👧">
          <FieldWrap label="Parent's employer" isNew={isNew('parent_employer')}>
            <TextInput value={data.parent_employer} onChange={set('parent_employer')} placeholder="Company name" />
          </FieldWrap>
          <FieldWrap label="Parent's industry" isNew={isNew('parent_industry')}>
            <TextInput value={data.parent_industry} onChange={set('parent_industry')} placeholder="e.g. Healthcare" />
          </FieldWrap>
          <FieldWrap label="Parent's union" isNew={isNew('parent_union')}>
            <TextInput value={data.parent_union} onChange={set('parent_union')} placeholder="Union name" />
          </FieldWrap>
        </Section>

        {/* Bottom Save */}
        <div className="pt-2 pb-8">
          <button onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl transition-colors shadow-md shadow-blue-200">
            Save profile →
          </button>
          <button onClick={onCancel} className="w-full mt-3 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cancel — discard import
          </button>
        </div>
      </div>
    </div>
  )
}
