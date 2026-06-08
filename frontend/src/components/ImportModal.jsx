import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

export default function ImportModal({ onImport, onClose }) {
  const [tab,      setTab]      = useState('file')   // 'file' | 'text'
  const [text,     setText]     = useState('')
  const [file,     setFile]     = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const fileRef  = useRef(null)

  // Esc to close
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
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleImport = async () => {
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
      onImport(data)
      onClose()
    } catch (e) {
      setError(e.message || 'Import failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Import your profile</h2>
            <p className="text-sm text-gray-400 mt-0.5">We'll read your document and fill in what we find</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
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
          {/* Supported sources hint */}
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
                  <p className="text-xs text-emerald-600 mt-1">Ready to import — click Import below</p>
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
            onClick={handleImport}
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
                Reading document…
              </span>
            ) : 'Import →'}
          </button>
        </div>
      </div>
    </div>
  )
}
