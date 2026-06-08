import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

// All fields in display order with labels and categories
const FIELD_META = [
  { key: 'name',               label: 'Full name',           cat: 'Basic' },
  { key: 'university',         label: 'University',          cat: 'Academic' },
  { key: 'major',              label: 'Major',               cat: 'Academic' },
  { key: 'year',               label: 'Year',                cat: 'Academic' },
  { key: 'gpa',                label: 'GPA',                 cat: 'Academic' },
  { key: 'intended_profession',label: 'Intended profession', cat: 'Academic' },
  { key: 'career_goal',        label: 'Career goal',         cat: 'Academic' },
  { key: 'hometown_city',      label: 'Hometown city',       cat: 'Location' },
  { key: 'hometown_state',     label: 'Hometown state',      cat: 'Location' },
  { key: 'hometown_county',    label: 'Hometown county',     cat: 'Location' },
  { key: 'high_school',        label: 'High school',         cat: 'Location' },
  { key: 'citizenship',        label: 'Citizenship',         cat: 'Identity' },
  { key: 'heritage',           label: 'Heritage',            cat: 'Identity' },
  { key: 'religion',           label: 'Religion',            cat: 'Identity' },
  { key: 'languages',          label: 'Languages',           cat: 'Identity' },
  { key: 'first_gen',          label: 'First-generation',    cat: 'Identity' },
  { key: 'financial_need',     label: 'Financial need',      cat: 'Identity' },
  { key: 'military_family',    label: 'Military family',     cat: 'Identity' },
  { key: 'income_bracket',     label: 'Income bracket',      cat: 'Identity' },
  { key: 'activities',         label: 'Activities',          cat: 'Affiliations' },
  { key: 'national_club_orgs', label: 'Club orgs',           cat: 'Affiliations' },
  { key: 'honors',             label: 'Honors',              cat: 'Affiliations' },
  { key: 'parent_employer',    label: "Parent's employer",   cat: 'Family' },
  { key: 'parent_industry',    label: "Parent's industry",   cat: 'Family' },
  { key: 'parent_union',       label: "Parent's union",      cat: 'Family' },
]

function displayValue(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'boolean') return val ? 'Yes' : null
  if (Array.isArray(val)) return val.length ? val.join(', ') : null
  return String(val)
}

function isFilled(val) {
  if (val === null || val === undefined || val === '' || val === false) return false
  if (Array.isArray(val)) return val.length > 0
  return true
}

// ─── Review screen ────────────────────────────────────────────────────────────

function ReviewScreen({ profile, warnings, filename, onConfirm, onBack }) {
  const found   = FIELD_META.filter(f => isFilled(profile[f.key]))
  const missing = FIELD_META.filter(f => !isFilled(profile[f.key]))

  const cats = [...new Set(found.map(f => f.cat))]

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 flex-shrink-0">
        <span className="text-xl">✅</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">
            {found.length} field{found.length !== 1 ? 's' : ''} found
            {filename && <span className="font-normal text-emerald-600"> in {filename}</span>}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Review below, then confirm to add to your profile
          </p>
        </div>
        {missing.length > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{missing.length} not found</span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <span>⚠️</span> Double-check these
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-800 leading-relaxed">• {w}</p>
            ))}
          </div>
        )}

        {/* Found fields by category */}
        {cats.map(cat => (
          <div key={cat}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{cat}</p>
            <div className="space-y-1.5">
              {found.filter(f => f.cat === cat).map(f => (
                <div key={f.key} className="flex items-start gap-3 text-sm">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-gray-400 w-36 flex-shrink-0 leading-relaxed">{f.label}</span>
                  <span className="text-gray-800 font-medium leading-relaxed break-words min-w-0">
                    {displayValue(profile[f.key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Missing fields */}
        {missing.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-2">Not found in document</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map(f => (
                <span key={f.key} className="text-xs text-gray-300 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  {f.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-2">These fields will stay as-is in your profile.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="py-3 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-colors"
        >
          Add {found.length} fields to profile →
        </button>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ImportModal({ onImport, onClose }) {
  const [tab,      setTab]      = useState('file')
  const [text,     setText]     = useState('')
  const [file,     setFile]     = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [review,   setReview]   = useState(null)   // { profile, warnings }
  const fileRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const handleFile = (f) => {
    if (!f) return
    const ok = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)
      || f.name.match(/\.(pdf|txt|doc|docx)$/i)
    if (!ok) { setError('Please upload a PDF, Word doc, or text file.'); return }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      if (tab === 'file' && file) {
        fd.append('file', file)
      } else if (tab === 'text' && text.trim()) {
        fd.append('text', text.trim())
      } else {
        setError('Add a file or paste some text first.')
        setLoading(false)
        return
      }

      const res = await fetch(`${API}/api/import-profile`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      setReview({ profile: data.profile, warnings: data.warnings || [] })
    } catch (e) {
      setError(e.message || 'Import failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onImport(review.profile)
    onClose()
  }

  const isReviewing = !!review

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white w-full rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
        isReviewing ? 'max-w-xl h-[92vh] md:h-[88vh]' : 'max-w-lg'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {isReviewing ? 'Review extracted profile' : 'Import your profile'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isReviewing ? 'Confirm what gets added to your profile' : "We'll read your document and fill in what we find"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Review screen */}
        {isReviewing ? (
          <ReviewScreen
            profile={review.profile}
            warnings={review.warnings}
            filename={file?.name}
            onConfirm={handleConfirm}
            onBack={() => setReview(null)}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
              {[['file', '📄 Upload file'], ['text', '📋 Paste text']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                    tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Works with resumes, CommonApp exports, transcripts, or any document that mentions your school, major, GPA, activities, or background.
              </p>

              {tab === 'file' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  {file ? (
                    <>
                      <p className="text-2xl mb-2">✅</p>
                      <p className="font-semibold text-emerald-700 text-sm">{file.name}</p>
                      <p className="text-xs text-emerald-600 mt-1">Ready — click Analyze below</p>
                      <button
                        onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-2 underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl mb-3">📄</p>
                      <p className="font-medium text-gray-600 text-sm">Drop your file here, or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, Word doc, or TXT · up to 10 MB</p>
                    </>
                  )}
                </div>
              )}

              {tab === 'text' && (
                <textarea
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`Paste anything — a resume, bio, CommonApp activities section, or even a quick summary:\n\n"I'm a junior at CU Boulder studying Computer Science with a 3.8 GPA. I'm in DECA and Key Club, from Denver, CO…"`}
                  className="w-full h-44 text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-300 leading-relaxed"
                />
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || (tab === 'file' ? !file : !text.trim())}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  loading || (tab === 'file' ? !file : !text.trim())
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analyzing…
                  </span>
                ) : 'Analyze →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
