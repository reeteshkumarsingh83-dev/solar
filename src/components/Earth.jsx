import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { makeEarthTexture, makeCloudsTexture } from '../utils/textures'

export default function Earth({ data, angleRef, onSelect, selected, timeScale = 1 }) {
  const groupRef = useRef()
  const planetRef = useRef()
  const cloudsRef = useRef()
  const moonGroupRef = useRef()

  const earthTex = useMemo(() => makeEarthTexture(), [])
  const cloudsTex = useMemo(() => makeCloudsTexture(), [])

  useFrame((_, delta) => {
    const dt = delta * timeScale
    angleRef.current += dt * data.speed * 0.15
    const x = Math.cos(angleRef.current) * data.distance
    const z = Math.sin(angleRef.current) * data.distance
    if (groupRef.current) groupRef.current.position.set(x, 0, z)
    if (planetRef.current) planetRef.current.rotation.y += dt * data.rotationSpeed
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * data.rotationSpeed * 1.4
    if (moonGroupRef.current) moonGroupRef.current.rotation.y += dt * 1.8
  })

  const isSelected = selected?.key === data.key

  return (
    <group ref={groupRef}>
      <mesh
        ref={planetRef}
        onClick={(e) => { e.stopPropagation(); onSelect(data) }}
      >
        <sphereGeometry args={[data.size, 48, 48]} />
        <meshStandardMaterial map={earthTex} roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh ref={cloudsRef} scale={1.015}>
        <sphereGeometry args={[data.size, 48, 48]} />
        <meshStandardMaterial map={cloudsTex} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* Moon */}
      <group ref={moonGroupRef}>
        <mesh position={[data.size * 1.9, 0, 0]}>
          <sphereGeometry args={[data.size * 0.27, 24, 24]} />
          <meshStandardMaterial color="#c9c9c9" roughness={1} />
        </mesh>
      </group>
      {isSelected && (
        <Html distanceFactor={12} position={[0, data.size + 0.6, 0]} center>
          <div className="label">{data.name}</div>
        </Html>
      )}
    </group>
  )
}
