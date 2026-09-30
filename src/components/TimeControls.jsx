const SPEEDS = [
  { label: '◀◀', value: -8 },
  { label: '◀', value: -2 },
  { label: '1×', value: 1 },
  { label: '▶', value: 8 },
  { label: '▶▶', value: 30 },
]

export default function TimeControls({ timeScale, setTimeScale, paused, setPaused, simDays }) {
  const years = Math.floor(simDays / 365)
  const days = Math.floor(simDays % 365)

  return (
    <div className="time-controls">
      <div className="time-readout">
        <span className="time-dim">Time</span>
        <strong>{years > 0 ? `${years}y ${days}d` : `${days}d`}</strong>
      </div>
      <div className="time-buttons">
        <button
          className={`time-btn pause-btn ${paused ? 'active' : ''}`}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? '▶' : '❚❚'}
        </button>
        {SPEEDS.map((s) => (
          <button
            key={s.label}
            className={`time-btn ${!paused && timeScale === s.value ? 'active' : ''}`}
            onClick={() => {
              setPaused(false)
              setTimeScale(s.value)
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
