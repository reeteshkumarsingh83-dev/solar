export default function InfoPanel({ selected, onClose }) {
  if (!selected) return null
  return (
    <div className="info-panel">
      <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
      <h2>{selected.name}</h2>
      <p>{selected.fact}</p>
    </div>
  )
}
