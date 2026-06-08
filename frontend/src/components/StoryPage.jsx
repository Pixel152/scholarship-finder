import { useState } from 'react'
import ImportModal from './ImportModal'

const API = import.meta.env.VITE_API_URL || ''

export default function StoryPage({ profile, onSave, onImportReview }) {
  const [extraContext,  setExtraContext]  = useState(profile?.extra_context  || '')
  const [linkedinUrl,   setLinkedinUrl]   = useState(profile?.linkedin_url   || '')
  const [websiteUrl,    setWebsiteUrl]    = useState(profile?.website_url    || '')
  const [portfolioUrl,  setPortfolioUrl]  = useState(profile?.portfolio_url  || '')
  const [importing,     setImporting]     = useState(null)
  const [importError,   setImportError]   = useState('')
  const [showImport,    setShowImport]    = useState(false)
  const [saved,         setSaved]         = useState(false)

  const handleSave = () => {
    onSave({ ...profile, extra_context: extraContext, linkedin_url: linkedinUrl, website_url: websiteUrl, portfolio_url: portfolioUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDocImport = ({ profile: imported, warnings }) => {
    onImportReview({ profile: imported, warnings, from: 'story' })
  }

  const handleUrlImport = async (url, source) => {
    if (!url.trim()) return
    setImportError('')
    setImporting(source)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 55000)
    try {
      const res = await fetch(`${API}/api/import-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      onImportReview({ profile: data.profile, warnings: data.warnings || [], from: 'story' })
    } catch (e) {
      if (e.name === 'AbortError') {
        setImportError('Request timed out — the page took too long to load. Try again.')
      } else {
        setImportError(e.message || 'Could not import — try again.')
      }
    } finally {
      clearTimeout(timer)
      setImporting(null)
    }
  }

  const inputCls = "w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-300"

  return (
    <>
      {showImport && <ImportModal onImport={handleDocImport} onClose={() => setShowImport(false)} />}

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
                saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-8">

          {/* Import section */}
          <div className="animate-fade-up">
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">Import from a document or profile</h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Upload a resume, paste text, or import from a linked profile — we'll extract anything useful and let you review before saving.
            </p>

            <div className="space-y-3">
              {/* Resume / document */}
              <button
                onClick={() => setShowImport(true)}
                className="w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Resume or document</p>
                  <p className="text-xs text-gray-400 mt-0.5">Upload a PDF, Word doc, or paste text</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* LinkedIn */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0077b5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">LinkedIn</p>
                    <p className="text-xs text-gray-400">Profile must be set to Public</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className={`${inputCls} flex-1`} />
                  <button
                    onClick={() => handleUrlImport(linkedinUrl, 'linkedin')}
                    disabled={!linkedinUrl.trim() || importing === 'linkedin'}
                    className={`flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                      !linkedinUrl.trim() || importing === 'linkedin'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#0077b5] hover:bg-[#006097] text-white shadow-sm'
                    }`}
                  >
                    {importing === 'linkedin' ? <Spinner /> : 'Import'}
                  </button>
                </div>
              </div>

              {/* Personal website */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Personal website</p>
                </div>
                <div className="flex gap-2">
                  <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className={`${inputCls} flex-1`} />
                  <button
                    onClick={() => handleUrlImport(websiteUrl, 'website')}
                    disabled={!websiteUrl.trim() || importing === 'website'}
                    className={`flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                      !websiteUrl.trim() || importing === 'website'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm'
                    }`}
                  >
                    {importing === 'website' ? <Spinner /> : 'Import'}
                  </button>
                </div>
              </div>

              {/* Portfolio — URL only, no import */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Portfolio / GitHub</p>
                    <p className="text-xs text-gray-400">Saved as a reference link</p>
                  </div>
                </div>
                <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourname"
                  className={inputCls} />
              </div>
            </div>

            {importError && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 leading-relaxed">{importError}</p>
            )}
          </div>

          {/* Extra context */}
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">Extra background</h2>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Anything that doesn't fit the profile form — a venture you started, research you did, personal story, work experience, unique circumstances. Sent to the AI when searching for scholarships.
            </p>
            <textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              placeholder={`Examples:\n• I co-founded a nonprofit that collected and redistributed used textbooks to 200+ students in my county.\n• I spent two summers doing marine biology research under Dr. Smith at UCLA.\n• My family immigrated from Vietnam when I was 8.\n• I taught myself iOS development and published two apps while in high school.`}
              className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder:text-gray-300 leading-7 min-h-[200px] shadow-sm"
            />
            <p className="text-xs text-gray-300 mt-1.5 text-right tabular-nums">
              {extraContext.trim() ? extraContext.trim().split(/\s+/).length : 0} words
            </p>
          </div>

          {/* Bottom save */}
          <div className="pb-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <button onClick={handleSave}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${
                saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
              }`}
            >
              {saved ? '✓ Changes saved' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Spinner() {
  return (
    <span className="flex items-center gap-1.5">
      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Importing
    </span>
  )
}
