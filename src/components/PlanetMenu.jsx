import { planetsData, sunData } from '../data/planets'

export default function PlanetMenu({ selected, onSelect, onKashmir }) {
  return (
    <div className="planet-menu">
      <button
        className={`chip sun-chip ${selected?.name === 'Sun' ? 'active' : ''}`}
        onClick={() => onSelect(sunData)}
      >
        ☀ {sunData.name}
      </button>
      {planetsData.map((p) => (
        <button
          key={p.key}
          className={`chip ${selected?.key === p.key ? 'active' : ''}`}
          style={{ '--chip-color': p.color }}
          onClick={() => onSelect(p)}
        >
          {p.name}
        </button>
      ))}
      <button className="chip kmr-chip" onClick={onKashmir}>
        ❄ Jammu &amp; Kashmir 3D
      </button>
    </div>
  )
}
