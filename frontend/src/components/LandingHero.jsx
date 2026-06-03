export default function LandingHero({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold text-blue-600 tracking-tight">ScholarMatch</span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-24">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-blue-100">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Powered by AI + real-time web search
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
          Find scholarships<br />
          <span className="text-blue-600">built for you</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
          We search beyond Fastweb and Chegg — local foundations, national clubs,
          professional associations, union funds. Every result is verified before we show it.
        </p>

        <button
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-10 py-4 rounded-xl text-lg shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Find My Scholarships →
        </button>

        <p className="mt-5 text-sm text-gray-400">
          Free · 2-minute setup · Results in ~10 minutes
        </p>

        <div className="mt-20 grid grid-cols-3 gap-16 text-center max-w-lg mx-auto">
          {[
            { value: '60+', label: 'search strategies' },
            { value: '10+', label: 'source categories' },
            { value: '100%', label: 'extract-verified' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-gray-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          {[
            {
              icon: '🏛️',
              title: 'Local foundations',
              body: 'Community trusts, county foundations, and city organizations that never appear on national aggregators.',
            },
            {
              icon: '🤝',
              title: 'Club & union funds',
              body: 'Key Club, DECA, FBLA, and parent union education funds — gated by membership, tiny applicant pools.',
            },
            {
              icon: '🔬',
              title: 'Professional associations',
              body: 'IEEE, ACM, AMA, and hundreds of other field-specific bodies that fund students entering their profession.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{title}</div>
              <div className="text-sm text-gray-500 leading-relaxed">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
