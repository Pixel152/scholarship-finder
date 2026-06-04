import { useMemo, useState } from 'react'

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseField(body, label) {
  // Handle both plain "Label: value" and markdown "**Label:** value" or "**Label: X/10**"
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\*{0,2}${escaped}:\\*{0,2}\\s*([^\\n]+)`, 'i')
  const raw = body.match(re)?.[1]?.trim() || ''
  return raw.replace(/\*+/g, '').trim()
}

function normalizeOutput(text) {
  return text
    .replace(/^#{1,3}\s*(#\d+\.)/gm, '$1')   // "## #1." → "#1."
    .replace(/^#{1,3}\s+(?!#)/gm, '')         // stray "## " lines without a rank
}

function parseBlock(block) {
  const lines = block.split('\n')
  // Strip any leading markdown bold/italic from the header line
  const headerLine = lines[0].replace(/\*+/g, '').trim()
  const header = headerLine.match(/^#(\d+)\.\s+(.+?)\s+[—–\-]+\s+(.+)$/)
  if (!header) return null

  const [, rankStr, name, org] = header
  const body = lines.slice(1).join('\n')

  const amountRaw = parseField(body, 'Amount')
  const statusRaw = parseField(body, 'Status')
  const easeRaw   = parseField(body, 'Ease of win')
  const applyRaw  = parseField(body, 'Apply')
  const awardsRaw = parseField(body, 'Awards\\/yr')

  // Status + deadline
  let status = 'UNKNOWN', deadline = ''
  if (/^OPEN/i.test(statusRaw)) {
    status = 'OPEN'
    deadline = statusRaw.replace(/^OPEN\s*[—–\-]?\s*(deadline\s*)?/i, '').trim()
  } else if (/^UPCOMING/i.test(statusRaw)) {
    status = 'UPCOMING'
    deadline = statusRaw.replace(/^UPCOMING\s*[—–\-]?\s*/i, '').trim()
  } else if (/^CLOSED/i.test(statusRaw)) {
    status = 'CLOSED'
  }

  // Score
  const scoreMatch = easeRaw.match(/(\d+)\/10/)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0
  const scoreReason = easeRaw.replace(/\d+\/10\s*[—–\-]?\s*/, '').trim()

  // Apply URL + contact — extract URL explicitly so stray text doesn't become the href
  const urlMatch    = applyRaw.match(/https?:\/\/[^\s|]+/)
  const applyUrl    = urlMatch?.[0]?.replace(/[),.:]+$/, '') || ''
  const applyContact = applyRaw.replace(urlMatch?.[0] || '', '').replace(/^\s*\|?\s*/, '').trim()

  return {
    rank: parseInt(rankStr),
    name: name.trim(),
    org: org.trim(),
    amount: amountRaw.split('|')[0].trim(),
    renewable: /renewable/i.test(amountRaw),
    status,
    deadline,
    eligibility: parseField(body, 'Eligibility'),
    awards: awardsRaw.split('—')[0].trim(),
    applyUrl,
    applyContact,
    effort: parseField(body, 'Effort'),
    pastWinners: parseField(body, 'Past winners'),
    match: parseField(body, 'Match'),
    score,
    scoreReason,
  }
}

function parseOutput(text) {
  const normalized = normalizeOutput(text)
  const scholarships = []
  const blocks = normalized.split(/(?=^#\d+\.)/m)

  for (const block of blocks) {
    if (!/^#\d+\./.test(block.trimStart())) continue
    try {
      const s = parseBlock(block.trimStart())
      if (s && s.status !== 'CLOSED') scholarships.push(s)
    } catch {}
  }

  const totalMatch = normalized.match(/TOTAL ESTIMATED VALUE[^\$\n]*(\$[\d,]+(?:\s*[–—\-]\s*\$[\d,]+)?)/i)
  const totalValue  = totalMatch?.[1] || ''

  const qwIdx    = normalized.indexOf('QUICK WINS THIS WEEK')
  const quickWins = qwIdx !== -1 ? normalized.slice(qwIdx + 20).trim() : ''

  return { scholarships, totalValue, quickWins }
}

// ─── Visual helpers ──────────────────────────────────────────────────────────

function scoreColors(score) {
  if (score >= 8) return { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', num: 'text-emerald-600' }
  if (score >= 6) return { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',     num: 'text-amber-600'   }
  return              { bar: 'bg-slate-300',       badge: 'bg-slate-50 text-slate-600 border-slate-200',     num: 'text-slate-500'   }
}

function StatusPill({ status, deadline }) {
  if (status === 'OPEN') return (
    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      OPEN{deadline ? ` · ${deadline}` : ''}
    </span>
  )
  if (status === 'UPCOMING') return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      UPCOMING{deadline ? ` · ${deadline}` : ''}
    </span>
  )
  return null
}

// ─── Card ────────────────────────────────────────────────────────────────────

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="flex-shrink-0 w-28 text-gray-400 pt-0.5">{label}</span>
      <span className="text-gray-700 leading-relaxed">{value}</span>
    </div>
  )
}

function ScholarshipCard({ s, saved = false, onSave, onUnsave }) {
  const c = scoreColors(s.score)

  const handleBookmark = () => {
    if (saved) onUnsave?.(makeTrackerId(s))
    else onSave?.(s)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Score bar */}
      <div className={`h-1 ${c.bar}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium mb-0.5">#{s.rank}</p>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{s.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{s.org}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBookmark}
              title={saved ? 'Remove from tracker' : 'Save to tracker'}
              className={`p-1.5 rounded-lg transition-all ${
                saved
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-sm font-bold ${c.badge}`}>
              {s.score}/10
            </div>
          </div>
        </div>

        {/* Status + amount */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <StatusPill status={s.status} deadline={s.deadline} />
          {s.amount && (
            <span className="text-sm font-semibold text-gray-800">
              {s.amount}
              {s.renewable && <span className="text-gray-400 font-normal"> · renewable</span>}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2.5">
          <Row label="Eligibility"   value={s.eligibility} />
          <Row label="Competition"   value={s.awards ? `${s.awards} awards/yr` : ''} />
          <Row label="Effort"        value={s.effort} />
          <Row label="Why you"       value={s.match} />
          <Row label="Past winners"  value={s.pastWinners} />
          {s.scoreReason && (
            <div className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-28 text-gray-400">Score reason</span>
              <span className={`${c.num} font-medium leading-relaxed`}>{s.scoreReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Apply footer */}
      {(s.applyUrl || s.applyContact) && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500 truncate min-w-0">{s.applyContact}</span>
          {s.applyUrl && /^https?:\/\//.test(s.applyUrl) && (
            <a
              href={s.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Apply →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fallback raw view ───────────────────────────────────────────────────────

function RawView({ output, onReset }) {
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={onReset} className="flex items-center gap-2 group">
          <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-lg font-light leading-none">←</span>
          <span className="text-xl leading-none">🎓</span>
          <span className="font-black text-gray-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">ScholarMatch</span>
        </button>
        <button onClick={onReset} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">My Profile</button>
      </div>
      <pre className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{output}</pre>
    </div>
  )
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export const makeTrackerId = (s) => `${s.name}|||${s.org}`.toLowerCase().slice(0, 80)

export default function Results({ output, onProfile, onNewSearch, trackerIds = new Set(), onSave, onUnsave }) {
  const [sort, setSort]     = useState('score')
  const [filter, setFilter] = useState('all')

  const { scholarships, totalValue, quickWins } = useMemo(() => parseOutput(output), [output])

  const displayed = useMemo(() => {
    let list = filter === 'open'     ? scholarships.filter(s => s.status === 'OPEN')
             : filter === 'upcoming' ? scholarships.filter(s => s.status === 'UPCOMING')
             : [...scholarships]

    if (sort === 'amount') {
      const firstNum = s => parseInt(s.amount?.match(/[\d,]+/)?.[0]?.replace(/,/g, '')) || 0
      list.sort((a, b) => firstNum(b) - firstNum(a))
    } else {
      list.sort((a, b) => b.score - a.score)
    }
    return list
  }, [scholarships, sort, filter])

  const openCount = scholarships.filter(s => s.status === 'OPEN').length

  if (scholarships.length === 0) return <RawView output={output} onReset={onProfile} />

  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: `scholarships-${new Date().toISOString().slice(0, 10)}.md` }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onProfile} className="flex items-center gap-2 group">
              <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-lg font-light leading-none">←</span>
              <span className="text-xl leading-none">🎓</span>
              <span className="font-black text-gray-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">ScholarMatch</span>
            </button>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              {scholarships.length} scholarships found
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={download} className="text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Download
            </button>
            <button onClick={onProfile} className="text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              My Profile
            </button>
            <button onClick={onNewSearch} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              New Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 w-full">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: scholarships.length, label: 'scholarships found', color: 'text-gray-900' },
            { value: openCount,           label: 'open right now',     color: 'text-emerald-600' },
            { value: totalValue || '—',   label: 'estimated value',    color: 'text-blue-600' },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
              <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Sort + filter bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-medium text-gray-500">Sort by</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Ease of win</option>
            <option value="amount">Amount</option>
          </select>

          <div className="flex items-center gap-1 ml-3 bg-gray-100 rounded-lg p-1">
            {[['all', 'All'], ['open', 'Open'], ['upcoming', 'Upcoming']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-400 ml-auto">{displayed.length} showing</span>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {displayed.map(s => (
          <ScholarshipCard
            key={s.rank}
            s={s}
            saved={trackerIds.has(makeTrackerId(s))}
            onSave={onSave}
            onUnsave={onUnsave}
          />
        ))}
        </div>

        {/* Quick wins */}
        {quickWins && (
          <div className="mt-10 bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
              <span>⚡</span> Quick Wins This Week
            </h3>
            <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">{quickWins}</p>
          </div>
        )}
      </div>
    </div>
  )
}
