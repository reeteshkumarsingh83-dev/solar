import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { makeBandedTexture, makeRockyTexture, makeRingTexture } from '../utils/textures'

export default function Planet({ data, angleRef, onSelect, selected, timeScale = 1 }) {
  const groupRef = useRef()
  const planetRef = useRef()
  const ringRef = useRef()

  const texture = useMemo(() => {
    if (data.banded) return makeBandedTexture(data.bandColors, data.key.length + 3)
    return makeRockyTexture(data.color, data.accent, data.key.length + 1)
  }, [data])

  const ringTexture = useMemo(() => (data.hasRing ? makeRingTexture() : null), [data.hasRing])

  useFrame((_, delta) => {
    const dt = delta * timeScale
    angleRef.current += dt * data.speed * 0.15
    const x = Math.cos(angleRef.current) * data.distance
    const z = Math.sin(angleRef.current) * data.distance
    if (groupRef.current) groupRef.current.position.set(x, 0, z)
    if (planetRef.current) planetRef.current.rotation.y += dt * data.rotationSpeed
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.05
  })

  const isSelected = selected?.key === data.key

  return (
    <group ref={groupRef}>
      <mesh ref={planetRef} onClick={(e) => { e.stopPropagation(); onSelect(data) }}>
        <sphereGeometry args={[data.size, 48, 48]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0.05} />
      </mesh>
      {data.hasRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[data.size * 1.4, data.size * 2.3, 64]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            side={THREE.DoubleSide}
            opacity={0.9}
          />
        </mesh>
      )}
      {isSelected && (
        <Html distanceFactor={12} position={[0, data.size + 0.6, 0]} center>
          <div className="label">{data.name}</div>
        </Html>
      )}
    </group>
  )
}
