import { useEffect, useRef } from 'react'

function calcProgress(events) {
  const searches = events.filter(e => e.type === 'search').length
  const extracts = events.filter(e => e.type === 'extract').length
  const texts    = events.filter(e => e.type === 'text').length

  if (texts > 0)    return Math.min(85 + texts * 3, 95)
  if (extracts > 0) return Math.min(50 + (extracts / 20) * 35, 84)
  if (searches > 0) return Math.min(2  + (searches / 45) * 48, 50)
  return 2
}

function phaseLabel(events) {
  const texts    = events.filter(e => e.type === 'text').length
  const extracts = events.filter(e => e.type === 'extract').length
  const searches = events.filter(e => e.type === 'search').length

  if (texts > 0)    return 'Building your results…'
  if (extracts > 0) return 'Verifying scholarship pages…'
  if (searches > 0) return 'Searching the web…'
  return 'Starting up…'
}

function EventRow({ event, index }) {
  if (event.type === 'search') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 animate-fade-in">
        <span className="text-blue-500 mt-0.5 flex-shrink-0 text-sm">🔍</span>
        <span className="text-sm text-gray-600 leading-relaxed">{event.query}</span>
      </div>
    )
  }
  if (event.type === 'extract') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 animate-fade-in">
        <span className="text-emerald-500 mt-0.5 flex-shrink-0 text-sm">📄</span>
        <span className="text-sm text-gray-500 leading-relaxed break-all">{event.url}</span>
      </div>
    )
  }
  if (event.type === 'error') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-red-400 mt-0.5 flex-shrink-0 text-sm">⚠️</span>
        <span className="text-sm text-red-500">{event.message}</span>
      </div>
    )
  }
  return null
}

export default function SearchProgress({ events, done = false }) {
  const logRef = useRef(null)

  const searches = events.filter(e => e.type === 'search').length
  const extracts = events.filter(e => e.type === 'extract').length
  const toolEvents = events.filter(e => e.type === 'search' || e.type === 'extract' || e.type === 'error')
  const recent = toolEvents.slice(-30)
  const progress = done ? 100 : calcProgress(events)
  const phase = done ? 'Done!' : phaseLabel(events)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6 border border-blue-100">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{phase}</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            This takes 5–10 minutes. Every scholarship is verified before appearing in your results.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{phase}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-300 mt-1.5">
            <span>Search</span>
            <span>Verify</span>
            <span>Results</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600 tabular-nums">{searches}</div>
            <div className="text-sm text-gray-500 mt-1">web searches</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">{extracts}</div>
            <div className="text-sm text-gray-500 mt-1">pages verified</div>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-600">Live activity</span>
            </div>
            <div ref={logRef} className="p-4 max-h-64 overflow-y-auto scrollbar-thin">
              {recent.map((ev, i) => <EventRow key={i} event={ev} index={i} />)}
            </div>
          </div>
        )}

        {recent.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Starting up…
          </div>
        )}
      </div>
    </div>
  )
}
