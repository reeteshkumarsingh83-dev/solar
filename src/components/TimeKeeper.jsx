import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Bridges the 3D frame loop (time dimension) to the HTML HUD without
// re-rendering the scene every frame.
export default function TimeKeeper({ timeScale = 1, onTick }) {
  const daysRef = useRef(0)
  const acc = useRef(0)

  useFrame((_, delta) => {
    daysRef.current += delta * timeScale * 4
    acc.current += delta
    if (acc.current > 0.2) {
      acc.current = 0
      onTick?.(daysRef.current)
    }
  })

  return null
}
