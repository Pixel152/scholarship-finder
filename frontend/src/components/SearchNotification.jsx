import { useEffect, useState } from 'react'

export default function SearchNotification({ events, status, output, onViewResults, onRetry, onDismiss }) {
  const [elapsed,   setElapsed]   = useState(0)
  const [startTime]               = useState(Date.now())
  const [visible,   setVisible]   = useState(false)

  // Fade in with a small delay so it doesn't flash on instant status changes
  useEffect(() => {
    if (status !== 'idle') {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [status])

  useEffect(() => {
    if (status !== 'running') return
    setElapsed(0)
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [status])

  if (status === 'idle') return null

  const searches = events.filter(e => e.type === 'search').length
  const extracts  = events.filter(e => e.type === 'extract').length
  const count     = output ? (output.match(/^#\d+\./gm) || []).length : 0
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  // Estimated progress (searches top out at ~65, extract steps at ~30)
  const searchPct  = Math.min(searches / 65, 1)
  const extractPct = Math.min(extracts / 30, 1)
  const progress   = Math.round(((searchPct * 0.5 + extractPct * 0.5) * 90)) // cap at 90% until done

  return (
    <div
      className={`fixed bottom-6 inset-x-0 flex justify-center z-50 px-4 pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto w-full max-w-md">

        {/* Progress track (running only) */}
        {status === 'running' && (
          <div className="h-0.5 bg-gray-700">
            <div
              className="h-0.5 bg-blue-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-3">

          {status === 'running' && (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Searching for scholarships…</p>
                <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                  {searches} searches · {extracts} pages read · {mm}:{ss}
                </p>
              </div>
            </>
          )}

          {status === 'done' && (
            <>
              <span className="text-xl flex-shrink-0 animate-pop-in">🎉</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{count} scholarship{count !== 1 ? 's' : ''} found!</p>
                <p className="text-xs text-gray-400 mt-0.5">Results are ready to view</p>
              </div>
              <button
                onClick={() => { onViewResults(); onDismiss() }}
                className="flex-shrink-0 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap press-effect"
              >
                View →
              </button>
              <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors text-lg leading-none ml-1 flex-shrink-0 press-effect">
                ×
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <span className="text-lg flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Search failed</p>
                <p className="text-xs text-gray-400 mt-0.5">Something went wrong</p>
              </div>
              <button onClick={onRetry} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap press-effect">
                Retry
              </button>
              <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors text-lg leading-none ml-1 flex-shrink-0 press-effect">
                ×
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
