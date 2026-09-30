import { useMemo } from 'react'
import * as THREE from 'three'
import { makeNebulaTexture } from '../utils/textures'

export default function Nebula() {
  const texture = useMemo(() => makeNebulaTexture(), [])

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[300, 32, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
