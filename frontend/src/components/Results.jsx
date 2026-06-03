import ReactMarkdown from 'react-markdown'

function extractScholarshipSection(output) {
  const markers = ['ALREADY APPLIED', '#1.', '## Results', '# Results']
  for (const marker of markers) {
    const idx = output.indexOf(marker)
    if (idx !== -1) return output.slice(idx)
  }
  return output
}

export default function Results({ output, onReset }) {
  const displayText = extractScholarshipSection(output)

  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scholarships-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 font-bold">ScholarMatch</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              Results ready
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={download}
              className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Download .md
            </button>
            <button
              onClick={onReset}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              New Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 w-full">
        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-code:text-sm">
          <ReactMarkdown>{displayText}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
