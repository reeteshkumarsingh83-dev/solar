import { useEffect, useRef, useState } from 'react'
import { createSpaceMusic } from '../utils/spaceMusic'

// Browsers only allow audio when it is created/resumed directly inside a user gesture,
// so the music engine is created lazily in the click/key handler — never on mount.
export default function MusicToggle() {
  const musicRef = useRef(null)
  const boxRef = useRef(null)
  const wantOnRef = useRef(true)
  const volumeRef = useRef(0.8)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)

  const play = () => {
    if (!musicRef.current) {
      musicRef.current = createSpaceMusic()
      musicRef.current.setVolume(volumeRef.current)
    }
    musicRef.current.start()
    setPlaying(true)
  }

  const pause = () => {
    musicRef.current?.stop()
    setPlaying(false)
  }

  // auto-start on the first interaction anywhere on the page
  useEffect(() => {
    const kick = (e) => {
      if (boxRef.current?.contains(e.target)) return
      if (wantOnRef.current && !musicRef.current) play()
    }
    window.addEventListener('pointerup', kick)
    window.addEventListener('keydown', kick)
    return () => {
      window.removeEventListener('pointerup', kick)
      window.removeEventListener('keydown', kick)
    }
  }, [])

  // shut the audio down when leaving the solar view
  useEffect(
    () => () => {
      musicRef.current?.dispose()
      musicRef.current = null
    },
    []
  )

  return (
    <div className="music-toggle" ref={boxRef}>
      <button
        className={`time-btn ${playing ? 'active' : ''}`}
        onClick={() => {
          wantOnRef.current = !playing
          if (playing) pause()
          else play()
        }}
        title={playing ? 'Mute music' : 'Play music'}
      >
        {playing ? '♫ Music on' : '♪ Music off'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => {
          const v = Number(e.target.value)
          volumeRef.current = v
          setVolume(v)
          musicRef.current?.setVolume(v)
        }}
        aria-label="Music volume"
      />
    </div>
  )
}
