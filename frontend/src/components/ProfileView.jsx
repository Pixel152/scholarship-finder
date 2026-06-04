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

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="flex-shrink-0 text-gray-400 w-32">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
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
  if (profile.first_gen)     flags.push('First-generation')
  if (profile.financial_need) flags.push('Financial need')
  if (profile.military_family) flags.push('Military family')
  if (profile.disability)    flags.push(profile.disability)
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

function completeness(profile) {
  const optional = [
    'intended_profession', 'hometown_county', 'state_of_residence',
    'high_school', 'heritage', 'religion',
    'income_bracket', 'disability',
    'parent_employer', 'parent_industry', 'parent_union', 'career_goal',
  ]
  const lists = ['languages', 'activities', 'national_club_orgs', 'honors', 'already_applied']
  let filled = 0
  for (const k of optional)  if (profile[k])        filled++
  for (const k of lists)     if (profile[k]?.length) filled++
  for (const k of ['first_gen', 'financial_need', 'military_family']) if (profile[k]) filled++
  return Math.round((filled / (optional.length + lists.length + 3)) * 100)
}

export default function ProfileView({ profile, lastSearch, user, onSearch, onEdit, onViewResults, onLogout, searchRunning = false }) {
  if (!profile) return null
  const pct = completeness(profile)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <span className="text-blue-600 font-bold text-xl tracking-tight">ScholarMatch</span>

          {/* Auth status */}
          <div className="flex items-center gap-2 text-sm">
            {user && (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {user.email}
                </span>
                <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 transition-colors text-xs border border-gray-200 px-2.5 py-1 rounded-lg">
                  Sign out
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Edit Profile
            </button>
            <button
              onClick={onSearch}
              disabled={searchRunning}
              className={`text-sm px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors ${
                searchRunning
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {searchRunning ? 'Searching…' : 'Find Scholarships →'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome back, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1.5">
            Your profile is saved. Update it anytime or run a new search.
          </p>
        </div>

        {/* Last search banner */}
        {lastSearch?.output && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-lg shadow-blue-200">
            <div>
              <p className="font-bold text-white text-lg">Last search · {formatDate(lastSearch.date)}</p>
              <p className="text-blue-200 text-sm mt-0.5">{lastSearch.count} scholarships found</p>
            </div>
            <button
              onClick={onViewResults}
              className="bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex-shrink-0"
            >
              View Results →
            </button>
          </div>
        )}

        {/* Profile completeness */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Profile completeness</span>
            <span className="text-sm font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct < 70 && (
            <p className="text-xs text-gray-400 mt-2">
              A fuller profile unlocks more scholarship categories —{' '}
              <button onClick={onEdit} className="text-blue-500 hover:underline font-medium">add more info</button>
            </p>
          )}
        </div>

        {/* Profile sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Section title="Academic" icon="🎓">
            <Row label="University"   value={profile.university} />
            <Row label="Major"        value={profile.major} />
            <Row label="Year"         value={profile.year ? profile.year.charAt(0).toUpperCase() + profile.year.slice(1) : ''} />
            <Row label="GPA"          value={profile.gpa} />
            <Row label="Profession"   value={profile.intended_profession} />
          </Section>

          <Section title="Location" icon="📍">
            <Row
              label="Hometown"
              value={[profile.hometown_city, profile.hometown_state].filter(Boolean).join(', ')}
            />
            <Row label="County"       value={profile.hometown_county} />
            <Row
              label="High school"
              value={[profile.high_school, profile.high_school_state].filter(Boolean).join(', ')}
            />
            <Row
              label="Citizenship"
              value={profile.citizenship?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            />
            {profile.state_of_residence && profile.state_of_residence !== profile.hometown_state && (
              <Row label="Now living in" value={profile.state_of_residence} />
            )}
          </Section>

          <Section title="Identity" icon="🌍">
            <Row label="Heritage"   value={profile.heritage} />
            <Row label="Religion"   value={profile.religion} />
            <TagRow label="Languages" items={profile.languages} />
            <FlagRow profile={profile} />
            {profile.income_bracket && (
              <Row label="Income"   value={profile.income_bracket} />
            )}
          </Section>

          <Section title="Affiliations" icon="🤝">
            <TagRow label="Activities"   items={profile.activities} />
            <TagRow label="Club orgs"    items={profile.national_club_orgs} />
            <TagRow label="Honors"       items={profile.honors} />
          </Section>

          <Section title="Family Background" icon="👨‍👩‍👧">
            <Row label="Employer"  value={profile.parent_employer} />
            <Row label="Industry"  value={profile.parent_industry} />
            <Row label="Union"     value={profile.parent_union} />
          </Section>

          <Section title="Goals" icon="🎯">
            <Row label="Career goal"    value={profile.career_goal} />
            {profile.already_applied?.length > 0 && (
              <TagRow label="Applied to" items={profile.already_applied} />
            )}
          </Section>

        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onEdit}
            className="py-3.5 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            ✏️  Edit Profile
          </button>
          <button
            onClick={onSearch}
            disabled={searchRunning}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all text-sm ${
              searchRunning
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 hover:-translate-y-0.5'
            }`}
          >
            {searchRunning ? '🔍  Searching in background…' : '🔍  Find Scholarships →'}
          </button>
        </div>
      </div>
    </div>
  )
}
