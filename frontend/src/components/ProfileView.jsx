function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
      {children}
    </span>
  )
}

function FlagTag({ children }) {
  return (
    <span className="inline-flex items-center bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full border border-violet-100">
      {children}
    </span>
  )
}

function Section({ title, icon, children, delay = 0 }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-lg animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base leading-none">{icon}</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="flex-shrink-0 text-gray-400 w-32 leading-relaxed">{label}</span>
      <span className="text-gray-800 font-medium leading-relaxed">{value}</span>
    </div>
  )
}

function TagRow({ label, items }) {
  if (!items?.length) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="flex-shrink-0 text-gray-400 w-32 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
    </div>
  )
}

function FlagRow({ profile }) {
  const flags = []
  if (profile.first_gen)      flags.push('First-generation')
  if (profile.financial_need) flags.push('Financial need')
  if (profile.military_family)flags.push('Military family')
  if (profile.disability)     flags.push(profile.disability)
  if (!flags.length) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="flex-shrink-0 text-gray-400 w-32 pt-0.5">Flags</span>
      <div className="flex flex-wrap gap-1.5">
        {flags.map(f => <FlagTag key={f}>{f}</FlagTag>)}
      </div>
    </div>
  )
}

// ─── Completeness ─────────────────────────────────────────────────────────────

const HIGH_IMPACT = [
  { key: 'national_club_orgs', type: 'list', label: 'National org memberships',    why: 'org-specific funds — FFA, DECA, Key Club, NHS each have dedicated scholarships' },
  { key: 'activities',         type: 'list', label: 'Activities & sports',          why: 'activity and sport-specific scholarships' },
  { key: 'hometown_county',    type: 'text', label: 'Hometown county',              why: 'county community foundation grants ($500–$5,000/yr)' },
  { key: 'high_school',        type: 'text', label: 'High school name',             why: 'alumni scholarship programs from your high school' },
  { key: 'heritage',           type: 'text', label: 'Heritage / ethnicity',         why: 'cultural organization and heritage-specific awards' },
  { key: 'career_goal',        type: 'text', label: 'Career goal',                  why: 'profession-specific scholarships in your field' },
  { key: 'parent_employer',    type: 'text', label: "Parent's employer",            why: 'employee-dependent scholarship funds' },
  { key: 'parent_union',       type: 'text', label: "Parent's union",               why: 'union education grant programs' },
  { key: 'first_gen',          type: 'bool', label: 'First-generation status',      why: 'first-generation college student scholarships' },
  { key: 'financial_need',     type: 'bool', label: 'Financial need',               why: 'need-based scholarship programs' },
]

function isFilled(profile, f) {
  if (f.type === 'list') return (profile[f.key]?.length || 0) > 0
  return !!profile[f.key]
}

function completeness(profile) {
  const filled = HIGH_IMPACT.filter(f => isFilled(profile, f)).length
  return Math.round((filled / HIGH_IMPACT.length) * 100)
}

function missingNudges(profile) {
  return HIGH_IMPACT.filter(f => !isFilled(profile, f)).slice(0, 3)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileView({ profile, lastSearch, user, onSearch, onEdit, onViewResults, onLogout, searchRunning = false }) {
  if (!profile) return null
  const pct    = completeness(profile)
  const nudges = missingNudges(profile)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10 px-4 md:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo on mobile only */}
          <span className="md:hidden text-blue-600 font-black text-lg tracking-tight flex-shrink-0">ScholarMatch</span>
          <span className="hidden md:block font-semibold text-gray-800 text-sm">Dashboard</span>

          {/* User & signout */}
          <div className="flex items-center gap-2 text-sm flex-1 justify-center md:justify-end">
            {user && (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 font-medium text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse2 flex-shrink-0" />
                  <span className="truncate max-w-[160px]">{user.email}</span>
                </span>
                <button onClick={onLogout} className="btn-ghost py-1 px-2.5 text-xs flex-shrink-0">
                  Sign out
                </button>
              </>
            )}
          </div>

          {/* Find Scholarships CTA */}
          <button
            onClick={onSearch}
            disabled={searchRunning}
            className={`flex-shrink-0 text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-150 ${
              searchRunning
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {searchRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Searching…
              </span>
            ) : 'Find Scholarships →'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* ── Greeting ────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Welcome back, {profile.name.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Your profile is saved. Update it anytime or run a new search.
          </p>
        </div>

        {/* ── Last search banner ──────────────────────────────────── */}
        {lastSearch?.output && (
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 md:p-6 mb-6 flex items-center justify-between gap-4 shadow-lg shadow-blue-200/50 animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            <div className="min-w-0">
              <p className="font-bold text-white text-base md:text-lg leading-snug">
                Last search · {formatDate(lastSearch.date)}
              </p>
              <p className="text-blue-200 text-sm mt-0.5">
                {lastSearch.count} scholarship{lastSearch.count !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={onViewResults}
              className="flex-shrink-0 bg-white text-blue-600 font-semibold text-sm px-4 md:px-5 py-2.5 rounded-xl hover:bg-blue-50 active:scale-[0.97] transition-all duration-150 whitespace-nowrap shadow-sm"
            >
              View Results →
            </button>
          </div>
        )}

        {/* ── Scholarship coverage ─────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6 animate-fade-up"
          style={{ animationDelay: '90ms' }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-gray-700">Scholarship coverage</span>
            <span className={`text-sm font-bold tabular-nums ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-blue-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {nudges.length > 0 && (
            <div className="mt-3.5 pt-3.5 border-t border-gray-50 space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fill these in to unlock more scholarships</p>
              {nudges.map(f => (
                <button key={f.key} onClick={onEdit}
                  className="w-full flex items-start gap-2.5 text-left group press-effect">
                  <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0 group-hover:border-blue-400 group-hover:bg-blue-50 transition-all duration-150" />
                  <span className="text-xs leading-relaxed">
                    <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{f.label}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="text-gray-500">{f.why}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {pct === 100 && (
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1.5">
              <span>✓</span> All high-impact fields filled — broadest possible search.
            </p>
          )}
        </div>

        {/* ── Profile sections grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Section title="Academic" icon="🎓" delay={120}>
            <Row label="University"  value={profile.university} />
            <Row label="Major"       value={profile.major} />
            <Row label="Year"        value={profile.year ? profile.year.charAt(0).toUpperCase() + profile.year.slice(1) : ''} />
            <Row label="GPA"         value={profile.gpa} />
            <Row label="Profession"  value={profile.intended_profession} />
          </Section>

          <Section title="Location" icon="📍" delay={160}>
            <Row label="Hometown" value={[profile.hometown_city, profile.hometown_state].filter(Boolean).join(', ')} />
            <Row label="County"       value={profile.hometown_county} />
            <Row label="High school"  value={[profile.high_school, profile.high_school_state].filter(Boolean).join(', ')} />
            <Row label="Citizenship"  value={profile.citizenship?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
            {profile.state_of_residence && profile.state_of_residence !== profile.hometown_state && (
              <Row label="Now living in" value={profile.state_of_residence} />
            )}
          </Section>

          <Section title="Identity" icon="🌍" delay={200}>
            <Row label="Heritage"    value={profile.heritage} />
            <Row label="Religion"    value={profile.religion} />
            <TagRow label="Languages" items={profile.languages} />
            <FlagRow profile={profile} />
            {profile.income_bracket && <Row label="Income" value={profile.income_bracket} />}
          </Section>

          <Section title="Affiliations" icon="🤝" delay={240}>
            <TagRow label="Activities"  items={profile.activities} />
            <TagRow label="Club orgs"   items={profile.national_club_orgs} />
            <TagRow label="Honors"      items={profile.honors} />
          </Section>

          <Section title="Family Background" icon="👨‍👩‍👧" delay={280}>
            <Row label="Employer"   value={profile.parent_employer} />
            <Row label="Industry"   value={profile.parent_industry} />
            <Row label="Union"      value={profile.parent_union} />
          </Section>

          <Section title="Goals" icon="🎯" delay={320}>
            <Row label="Career goal" value={profile.career_goal} />
            {profile.already_applied?.length > 0 && (
              <TagRow label="Applied to" items={profile.already_applied} />
            )}
          </Section>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────── */}
        <div
          className="mt-6 flex gap-3 animate-fade-up"
          style={{ animationDelay: '360ms' }}
        >
          <button
            onClick={onEdit}
            className="btn-ghost py-3.5 px-5 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
          <button
            onClick={onSearch}
            disabled={searchRunning}
            className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              searchRunning
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/60 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {searchRunning ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Searching in background…
              </>
            ) : '🔍  Find Scholarships →'}
          </button>
        </div>
      </div>
    </div>
  )
}
