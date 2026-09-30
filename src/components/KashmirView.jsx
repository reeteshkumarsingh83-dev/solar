import { useState } from 'react'
import KashmirScene, { KASHMIR_PLACES } from './KashmirScene'

export default function KashmirView({ onBack }) {
  const [selected, setSelected] = useState(null)
  const [showSnow, setShowSnow] = useState(true)
  const [showClouds, setShowClouds] = useState(true)

  return (
    <div className="app-root kashmir-root">
      <KashmirScene
        selected={selected}
        onSelect={setSelected}
        showSnow={showSnow}
        showClouds={showClouds}
      />

      <header className="hero kashmir-hero">
        <h1>Jammu &amp; Kashmir ❄</h1>
        <p>3D winter view · Jammu plains → Pir Panjal → Kashmir valley → Great Himalaya</p>
      </header>

      <div className="kmr-controls">
        <button className="time-btn" onClick={onBack}>← Solar System</button>
        <button className={`time-btn ${showSnow ? 'active' : ''}`} onClick={() => setShowSnow((s) => !s)}>
          ❄ Snow
        </button>
        <button className={`time-btn ${showClouds ? 'active' : ''}`} onClick={() => setShowClouds((s) => !s)}>
          ☁ Clouds
        </button>
      </div>

      <div className="planet-menu">
        <button className={`chip kmr-chip ${!selected ? 'active' : ''}`} onClick={() => setSelected(null)}>
          Overview
        </button>
        {KASHMIR_PLACES.map((p) => (
          <button
            key={p.key}
            className={`chip kmr-chip ${selected?.key === p.key ? 'active' : ''}`}
            onClick={() => setSelected(p)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="info-panel">
          <button className="close-btn" onClick={() => setSelected(null)}>×</button>
          <h2>{selected.name}</h2>
          <p>{selected.info}</p>
          <p className="kmr-coords">
            {selected.lat.toFixed(2)}°N, {selected.lon.toFixed(2)}°E
          </p>
        </div>
      )}

      <footer className="hint kmr-hint">
        Drag to rotate · Right-drag to pan · Scroll to zoom · Click a place to fly there
      </footer>
    </div>
  )
}
