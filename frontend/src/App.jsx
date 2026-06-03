import { useRef, useState } from 'react'
import LandingHero from './components/LandingHero'
import MultiStepForm from './components/MultiStepForm'
import SearchProgress from './components/SearchProgress'
import Results from './components/Results'

export default function App() {
  const [view, setView] = useState('landing')
  const [events, setEvents] = useState([])
  const [output, setOutput] = useState('')
  const eventsRef = useRef([])

  const handleSearch = async (profileData) => {
    eventsRef.current = []
    setEvents([])
    setOutput('')
    setView('searching')

    const apiBase = import.meta.env.VITE_API_URL || ''

    try {
      const res = await fetch(`${apiBase}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop()

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(part.slice(6))
            if (ev.type === 'heartbeat') continue

            if (ev.type === 'done') {
              setOutput(fullText)
              setView('results')
              return
            }
            if (ev.type === 'text') {
              fullText += ev.content + '\n\n'
            }
            if (['search', 'extract', 'text', 'error'].includes(ev.type)) {
              eventsRef.current = [...eventsRef.current, ev]
              setEvents([...eventsRef.current])
            }
          } catch {}
        }
      }

      // Stream ended without done event — show what we have
      if (fullText) {
        setOutput(fullText)
        setView('results')
      }
    } catch (err) {
      eventsRef.current = [...eventsRef.current, { type: 'error', message: err.message }]
      setEvents([...eventsRef.current])
    }
  }

  const reset = () => {
    setView('landing')
    setEvents([])
    setOutput('')
    eventsRef.current = []
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'landing' && <LandingHero onStart={() => setView('form')} />}
      {view === 'form' && <MultiStepForm onSubmit={handleSearch} onBack={reset} />}
      {view === 'searching' && <SearchProgress events={events} />}
      {view === 'results' && <Results output={output} onReset={reset} />}
    </div>
  )
}
