import { useEffect, useState } from 'react'

export default function SearchNotification({ events, status, output, onViewResults, onRetry, onDismiss }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (status !== 'running') return
    setElapsed(0)
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [status])

  if (status === 'idle') return null

  const searches = events.filter(e => e.type === 'search').length
  const extracts = events.filter(e => e.type === 'extract').length
  const count    = output ? (output.match(/^#\d+\./gm) || []).length : 0
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-4 pointer-events-none animate-fade-up">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 pointer-events-auto w-full max-w-lg">

        {status === 'running' && (
          <>
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Searching for scholarships…</p>
              <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                {searches} searches · {extracts} pages verified · {mm}:{ss}
              </p>
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <span className="text-lg flex-shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{count} scholarship{count !== 1 ? 's' : ''} found!</p>
              <p className="text-xs text-gray-400 mt-0.5">Your results are ready</p>
            </div>
            <button
              onClick={() => { onViewResults(); onDismiss() }}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              View Results →
            </button>
            <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors text-xl leading-none ml-1 flex-shrink-0">×</button>
          </>
        )}

        {status === 'failed' && (
          <>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Search failed</p>
              <p className="text-xs text-gray-400 mt-0.5">Try again from your profile</p>
            </div>
            <button onClick={onRetry} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Try Again
            </button>
            <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors text-xl leading-none ml-1 flex-shrink-0">×</button>
          </>
        )}

      </div>
    </div>
  )
}
