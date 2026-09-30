import { useState, useCallback } from 'react'
import SolarSystem from './components/SolarSystem'
import InfoPanel from './components/InfoPanel'
import PlanetMenu from './components/PlanetMenu'
import TimeControls from './components/TimeControls'
import KashmirView from './components/KashmirView'
import MusicToggle from './components/MusicToggle'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState(null)
  const [timeScale, setTimeScale] = useState(1)
  const [paused, setPaused] = useState(false)
  const [simDays, setSimDays] = useState(0)

  const [showKashmir, setShowKashmir] = useState(false)

  const handleTick = useCallback((days) => setSimDays(days), [])

  if (showKashmir) return <KashmirView onBack={() => setShowKashmir(false)} />

  return (
    <div className="app-root">
      <SolarSystem
        selected={selected}
        onSelect={setSelected}
        timeScale={paused ? 0 : timeScale}
        onTick={handleTick}
      />

      <header className="hero">
        <h1>Developed by Masti</h1>
        {/* <p>Our Solar System — a 4D journey (space + time) through the Sun, planets, and the nature globe (Earth)</p> */}
      </header>

      <TimeControls
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        paused={paused}
        setPaused={setPaused}
        simDays={simDays}
      />

      <PlanetMenu selected={selected} onSelect={setSelected} onKashmir={() => setShowKashmir(true)} />
      <InfoPanel selected={selected} onClose={() => setSelected(null)} />
      <MusicToggle />

      <footer className="hint">
        Drag to rotate · Scroll to zoom · Click a planet for details · Use the time controls above to change speed
      </footer>
    </div>
  )
}
