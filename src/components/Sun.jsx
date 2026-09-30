import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { makeSunTexture } from '../utils/textures'
import { sunData } from '../data/planets'

export default function Sun({ onSelect, selected, timeScale = 1 }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const texture = useMemo(() => makeSunTexture(), [])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05 * timeScale
    if (glowRef.current) {
      const t = performance.now() * 0.001
      const s = 1 + Math.sin(t * 1.5) * 0.02
      glowRef.current.scale.setScalar(s)
    }
  })

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(sunData) }}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[sunData.size, 64, 64]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh ref={glowRef} scale={1.25}>
        <sphereGeometry args={[sunData.size, 32, 32]} />
        <meshBasicMaterial color="#ff9d3c" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <pointLight color="#fff3d0" intensity={3.5} distance={200} decay={1.2} />
      {selected?.name === 'Sun' && (
        <Html distanceFactor={20} position={[0, sunData.size + 1, 0]} center>
          <div className="label">{sunData.name}</div>
        </Html>
      )}
    </group>
  )
}
