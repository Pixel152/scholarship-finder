import { useState } from 'react'

const STATUS = {
  saved:       { label: 'Saved',       emoji: '🔖', bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400',  activeBorder: 'border-slate-400'  },
  in_progress: { label: 'In Progress', emoji: '✍️',  bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400',  activeBorder: 'border-amber-400'  },
  applied:     { label: 'Applied',     emoji: '📬', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500',   activeBorder: 'border-blue-500'   },
  won:         { label: 'Won',         emoji: '🏆', bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500',  activeBorder: 'border-green-500'  },
  declined:    { label: 'Declined',    emoji: '✕',  bg: 'bg-red-50',     text: 'text-red-500',    dot: 'bg-red-300',    activeBorder: 'border-red-300'    },
}
const STATUS_ORDER = ['saved', 'in_progress', 'applied', 'won', 'declined']

function StatusBadge({ status }) {
  const c = STATUS[status] || STATUS.saved
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

function TrackerCard({ item, onUpdateStatus, onUpdateNotes, onRemove }) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const saveNotes = () => {
    onUpdateNotes(item.id, notes)
    setEditingNotes(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            {item.amount && <p className="font-bold text-gray-900 text-sm">{item.amount}</p>}
            {item.deadline && <p className="text-xs text-gray-400 mt-1">{item.deadline}</p>}
          </div>
        </div>

        {/* Status selector */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {STATUS_ORDER.map(s => {
            const c = STATUS[s]
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

        {/* Notes */}
        <div className="border-t border-gray-50 pt-3">
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes, essay prompts, requirements, contact info…"
                rows={3}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 resize-none transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save
                </button>
                <button onClick={() => { setNotes(item.notes || ''); setEditingNotes(false) }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="w-full text-left flex items-start gap-2 group"
            >
              <span className="text-base leading-none mt-0.5 flex-shrink-0">📝</span>
              <span className={`text-sm transition-colors ${
                item.notes ? 'text-gray-600 group-hover:text-gray-800' : 'text-gray-300 group-hover:text-gray-400'
              }`}>
                {item.notes || 'Add notes, essay prompt, deadline details…'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button onClick={() => onRemove(item.id)}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors">
          Remove
        </button>
        {item.applyUrl && /^https?:\/\//.test(item.applyUrl) ? (
          <a href={item.applyUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
            Apply →
          </a>
        ) : item.applyContact ? (
          <span className="text-xs text-gray-400">{item.applyContact}</span>
        ) : null}
      </div>
    </div>
  )
}

export default function TrackerView({ items, onBack, onUpdateStatus, onUpdateNotes, onRemove }) {
  const [filter, setFilter] = useState('all')

  const counts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: items.filter(i => i.trackerStatus === s).length }), {})
  const displayed = filter === 'all' ? items : items.filter(i => i.trackerStatus === filter)

  const TABS = [
    { key: 'all',         label: 'All',         count: items.length,          color: 'text-gray-900'   },
    { key: 'saved',       label: 'Saved',        count: counts.saved,          color: 'text-slate-600'  },
    { key: 'in_progress', label: 'In Progress',  count: counts.in_progress,    color: 'text-amber-600'  },
    { key: 'applied',     label: 'Applied',      count: counts.applied,        color: 'text-blue-600'   },
    { key: 'won',         label: 'Won 🏆',        count: counts.won,            color: 'text-green-600'  },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 group">
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-lg font-light">←</span>
            <span className="text-xl leading-none">🎓</span>
            <span className="font-black text-gray-900 text-base group-hover:text-blue-600 transition-colors">ScholarMatch</span>
          </button>
          <h1 className="font-bold text-gray-900">My Tracker</h1>
          <div className="w-28" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Stats / filter tabs */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`bg-white rounded-xl border p-3 text-center transition-all ${
                filter === tab.key
                  ? 'border-blue-500 shadow-sm shadow-blue-100'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`text-2xl font-bold tabular-nums ${tab.color}`}>{tab.count}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* Empty states */}
        {items.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔖</div>
            <p className="text-xl font-bold text-gray-700">Nothing saved yet</p>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">
              Tap the bookmark on any scholarship in your results to track it here.
            </p>
          </div>
        )}

        {items.length > 0 && displayed.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">No scholarships with this status</p>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-4">
          {displayed.map(item => (
            <TrackerCard
              key={item.id}
              item={item}
              onUpdateStatus={onUpdateStatus}
              onUpdateNotes={onUpdateNotes}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
