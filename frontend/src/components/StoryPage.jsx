import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

export default function StoryPage({ profile, onSave, onImportReview }) {
  const [extraContext,  setExtraContext]  = useState(profile?.extra_context  || '')
  const [linkedinUrl,   setLinkedinUrl]   = useState(profile?.linkedin_url   || '')
  const [websiteUrl,    setWebsiteUrl]    = useState(profile?.website_url    || '')
  const [portfolioUrl,  setPortfolioUrl]  = useState(profile?.portfolio_url  || '')
  const [importing,     setImporting]     = useState(null)  // 'linkedin' | 'website'
  const [importError,   setImportError]   = useState('')
  const [saved,         setSaved]         = useState(false)

  const handleSave = () => {
    onSave({ ...profile, extra_context: extraContext, linkedin_url: linkedinUrl, website_url: websiteUrl, portfolio_url: portfolioUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = async (url, source) => {
    if (!url.trim()) return
    setImportError('')
    setImporting(source)
    try {
      const res = await fetch(`${API}/api/import-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      onImportReview({ profile: data.profile, warnings: data.warnings || [], from: 'story' })
    } catch (e) {
      setImportError(e.message || 'Could not import — make sure the profile is public.')
    } finally {
      setImporting(null)
    }
  }

  const inputCls = "w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-300"

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="md:hidden font-black text-blue-600 text-lg tracking-tight">ScholarMatch</span>
            <h1 className="font-bold text-gray-900 text-base hidden md:block">My Story</h1>
            <h1 className="font-bold text-gray-900 text-base md:hidden">My Story</h1>
          </div>
          <button
            onClick={handleSave}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Extra context */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-sm font-bold text-gray-900">Extra background</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Anything that doesn't fit the profile form — a venture you started, research you did, personal story, volunteering, work experience, unique circumstances. This is sent to the AI when searching for scholarships.
          </p>
          <textarea
            value={extraContext}
            onChange={e => setExtraContext(e.target.value)}
            placeholder={`Examples:\n• I co-founded a nonprofit that collected and redistributed used textbooks to 200+ students in my county.\n• I spent two summers doing marine biology research under Dr. Smith at UCLA.\n• My family immigrated from Vietnam when I was 8 — I grew up translating for my parents.\n• I taught myself iOS development and published two apps while in high school.`}
            className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder:text-gray-300 leading-7 min-h-[220px] shadow-sm"
          />
          <p className="text-xs text-gray-300 mt-1.5 text-right tabular-nums">
            {extraContext.trim() ? extraContext.trim().split(/\s+/).length : 0} words
          </p>
        </div>

        {/* Linked profiles */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h2 className="text-sm font-bold text-gray-900 mb-1.5">Linked profiles</h2>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Paste a URL and click Import to pull your info directly from the page.
          </p>

          <div className="space-y-4">
            {/* LinkedIn */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#0077b5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">LinkedIn</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={() => handleImport(linkedinUrl, 'linkedin')}
                  disabled={!linkedinUrl.trim() || importing === 'linkedin'}
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                    !linkedinUrl.trim() || importing === 'linkedin'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#0077b5] hover:bg-[#006097] text-white shadow-sm'
                  }`}
                >
                  {importing === 'linkedin' ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Importing
                    </span>
                  ) : 'Import'}
                </button>
              </div>
            </div>

            {/* Website */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Personal website</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={() => handleImport(websiteUrl, 'website')}
                  disabled={!websiteUrl.trim() || importing === 'website'}
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                    !websiteUrl.trim() || importing === 'website'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm'
                  }`}
                >
                  {importing === 'website' ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Importing
                    </span>
                  ) : 'Import'}
                </button>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Portfolio / GitHub</span>
              </div>
              <input
                type="url"
                value={portfolioUrl}
                onChange={e => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/yourname or portfolio link"
                className={inputCls}
              />
              <p className="text-xs text-gray-300 mt-2">Saved as a reference — not imported</p>
            </div>
          </div>

          {importError && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{importError}</p>
          )}
        </div>

        {/* Bottom save */}
        <div className="pb-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <button onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
            }`}
          >
            {saved ? '✓ Changes saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
