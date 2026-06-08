const NAV_ITEMS = [
  {
    key: 'profile',
    label: 'Home',
    icon: (active) => (
      <svg className="w-5 h-5 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'results',
    label: 'Results',
    icon: (active) => (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'tracker',
    label: 'Tracker',
    icon: (active) => (
      <svg className="w-5 h-5 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    key: 'edit',
    label: 'Profile',
    icon: (active) => (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'story',
    label: 'My Story',
    icon: (active) => (
      <svg className="w-5 h-5 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ activeView, onNavigate, trackerCount = 0, hasResults = false, children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Left sidebar — desktop ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-20 shadow-[1px_0_0_0_#f1f5f9]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-base leading-none">🎓</span>
            </div>
            <span className="font-black text-gray-900 text-base tracking-tight">ScholarMatch</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map(item => {
            const active   = activeView === item.key
            const disabled = item.key === 'results' && !hasResults
            return (
              <button
                key={item.key}
                onClick={() => !disabled && onNavigate(item.key)}
                disabled={disabled}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 relative
                  ${active
                    ? 'bg-blue-50 text-blue-700'
                    : disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {/* Active left-border pill */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full" />
                )}
                <span className={`transition-colors duration-150 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon(active)}
                </span>
                <span>{item.label}</span>
                {item.key === 'tracker' && trackerCount > 0 && (
                  <span className="ml-auto bg-blue-600 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 leading-none tabular-nums">
                    {trackerCount > 9 ? '9+' : trackerCount}
                  </span>
                )}
                {item.key === 'results' && disabled && (
                  <span className="ml-auto text-[10px] text-gray-300 font-normal">search first</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-50">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Data saved locally &amp; synced to your account.
          </p>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0">
        {children}
      </div>

      {/* ── Bottom tab bar — mobile ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-20">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const active   = activeView === item.key
            const disabled = item.key === 'results' && !hasResults
            return (
              <button
                key={item.key}
                onClick={() => !disabled && onNavigate(item.key)}
                disabled={disabled}
                className={`
                  flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium
                  transition-colors duration-150 relative press-effect
                  ${active ? 'text-blue-600' : disabled ? 'text-gray-200' : 'text-gray-400'}
                `}
              >
                {/* Active indicator bar at top */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-blue-600 rounded-full" />
                )}
                <span className={`transition-transform duration-150 ${active ? 'scale-110' : ''}`}>
                  {item.icon(active)}
                </span>
                <span>{item.label}</span>
                {item.key === 'tracker' && trackerCount > 0 && (
                  <span className="absolute top-2 right-[calc(50%-18px)] bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {trackerCount > 9 ? '9+' : trackerCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  )
}
