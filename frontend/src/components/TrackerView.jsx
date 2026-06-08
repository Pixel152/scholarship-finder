import { useEffect, useState } from 'react'

const STATUS = {
  saved:       { label: 'Saved',       emoji: '🔖', bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400',  activeBorder: 'border-slate-400'  },
  in_progress: { label: 'In Progress', emoji: '✍️',  bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400',  activeBorder: 'border-amber-400'  },
  applied:     { label: 'Applied',     emoji: '📬', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500',   activeBorder: 'border-blue-500'   },
  won:         { label: 'Won',         emoji: '🏆', bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500',  activeBorder: 'border-green-500'  },
  declined:    { label: 'Declined',    emoji: '✕',  bg: 'bg-red-50',     text: 'text-red-500',    dot: 'bg-red-300',    activeBorder: 'border-red-300'    },
}
const STATUS_ORDER = ['saved', 'in_progress', 'applied', 'won', 'declined']

// ─── Essay modal ──────────────────────────────────────────────────────────────

function EssayModal({ item, onSave, onClose }) {
  const [text, setText] = useState(item.notes || '')

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const handleSave = () => {
    onSave(item.id, text)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl h-[92vh] md:h-[82vh] rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="font-bold text-gray-900 text-base leading-snug truncate">{item.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{item.org}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Quick-info strip */}
        {(item.amount || item.deadline || item.applyUrl) && (
          <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500 flex-shrink-0">
            {item.amount   && <span className="flex items-center gap-1">💰 {item.amount}</span>}
            {item.deadline && <span className="flex items-center gap-1">📅 {item.deadline}</span>}
            {item.applyUrl && /^https?:\/\//.test(item.applyUrl) && (
              <a href={item.applyUrl} target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1">
                Apply link →
              </a>
            )}
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Notes, essay drafts, requirements for ${item.name}…\n\nIdeas:\n• Paste the essay prompt here and draft below it\n• List eligibility requirements to verify\n• Add contact info, portfolio links, or references\n• Track what you've submitted`}
            className="flex-1 w-full text-gray-800 text-sm leading-7 bg-transparent outline-none resize-none placeholder:text-gray-300"
          />
        </div>

        {/* Footer — word / char count */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
          <span>Press Esc to close without saving</span>
          <div className="flex gap-4 tabular-nums">
            <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS[status] || STATUS.saved
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ─── Tracker card ─────────────────────────────────────────────────────────────

function TrackerCard({ item, onUpdateStatus, onOpenEssay, onRemove, index = 0 }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden transition-all duration-200 hover:shadow-card-lg hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <StatusBadge status={item.trackerStatus} />
              {item.scholarshipStatus === 'OPEN' && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                  Open
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 leading-snug">{item.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{item.org}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {item.amount   && <p className="font-bold text-gray-900 text-sm">{item.amount}</p>}
            {item.deadline && <p className="text-xs text-gray-400 mt-1">{item.deadline}</p>}
          </div>
        </div>

        {/* Status selector */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {STATUS_ORDER.map(s => {
            const c      = STATUS[s]
            const active = item.trackerStatus === s
            return (
              <button
                key={s}
                onClick={() => onUpdateStatus(item.id, s)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? `${c.bg} ${c.text} ${c.activeBorder} shadow-sm`
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            )
          })}
        </div>

        {/* Notes preview — opens essay modal on click */}
        <button
          onClick={() => onOpenEssay(item)}
          className="w-full text-left border-t border-gray-50 pt-3 flex items-start gap-2.5 group"
        >
          <span className="text-base leading-none mt-0.5 flex-shrink-0">📝</span>
          <div className="flex-1 min-w-0">
            {item.notes ? (
              <>
                <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors leading-relaxed line-clamp-2">
                  {item.notes}
                </p>
                <p className="text-xs text-gray-300 mt-1 group-hover:text-blue-400 transition-colors">
                  Click to open full editor
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-300 group-hover:text-gray-400 transition-colors">
                Add notes, essay draft, requirements…
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-gray-200 group-hover:text-blue-400 transition-colors mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
        {item.applyUrl && /^https?:\/\//.test(item.applyUrl) ? (
          <a
            href={item.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Apply →
          </a>
        ) : item.applyContact ? (
          <span className="text-xs text-gray-400">{item.applyContact}</span>
        ) : null}
      </div>
    </div>
  )
}

// ─── Main TrackerView ─────────────────────────────────────────────────────────

export default function TrackerView({ items, onUpdateStatus, onUpdateNotes, onRemove }) {
  const [filter,      setFilter]      = useState('all')
  const [editingItem, setEditingItem] = useState(null)

  const counts    = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: items.filter(i => i.trackerStatus === s).length }), {})
  const displayed = filter === 'all' ? items : items.filter(i => i.trackerStatus === filter)

  const TABS = [
    { key: 'all',         label: 'All',         count: items.length,       color: 'text-gray-900'  },
    { key: 'saved',       label: 'Saved',        count: counts.saved,       color: 'text-slate-600' },
    { key: 'in_progress', label: 'In Progress',  count: counts.in_progress, color: 'text-amber-600' },
    { key: 'applied',     label: 'Applied',      count: counts.applied,     color: 'text-blue-600'  },
    { key: 'won',         label: 'Won 🏆',        count: counts.won,         color: 'text-green-600' },
  ]

  return (
    <>
      {/* Essay modal — rendered above everything when open */}
      {editingItem && (
        <EssayModal
          item={editingItem}
          onSave={onUpdateNotes}
          onClose={() => setEditingItem(null)}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {/* Mobile: show app name; desktop: sidebar already shows it */}
            <span className="md:hidden font-black text-blue-600 text-lg tracking-tight">ScholarMatch</span>
            <h1 className="font-bold text-gray-900 text-base hidden md:block">My Tracker</h1>
            <h1 className="font-bold text-gray-900 text-base md:hidden">Tracker</h1>
            <div className="hidden md:block w-24" />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Stats / filter tabs */}
          <div className="grid grid-cols-5 gap-2 md:gap-3 mb-6">
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`bg-white rounded-xl border p-2.5 md:p-3 text-center transition-all duration-150 press-effect animate-fade-up ${
                  filter === tab.key
                    ? 'border-blue-500 shadow-sm shadow-blue-100 -translate-y-0.5'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-card'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={`text-xl md:text-2xl font-bold tabular-nums ${tab.color}`}>{tab.count}</div>
                <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 leading-tight">{tab.label}</div>
              </button>
            ))}
          </div>

          {/* Empty states */}
          {items.length === 0 && (
            <div className="text-center py-20 md:py-28 animate-fade-up">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">
                🔖
              </div>
              <p className="text-xl font-bold text-gray-800">Nothing saved yet</p>
              <p className="text-gray-400 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
                Tap the bookmark icon on any scholarship in your results to start tracking it here.
              </p>
            </div>
          )}

          {items.length > 0 && displayed.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <p className="text-base font-semibold text-gray-400">No scholarships with this status yet</p>
            </div>
          )}

          {/* Cards */}
          <div className="space-y-4">
            {displayed.map((item, i) => (
              <TrackerCard
                key={item.id}
                item={item}
                index={i}
                onUpdateStatus={onUpdateStatus}
                onOpenEssay={setEditingItem}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
