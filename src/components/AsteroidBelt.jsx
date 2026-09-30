import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 400
const INNER = 15.8
const OUTER = 17.6

export default function AsteroidBelt({ timeScale = 1 }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const rocks = useMemo(() => {
    const arr = []
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        angle: Math.random() * Math.PI * 2,
        radius: INNER + Math.random() * (OUTER - INNER),
        speed: 0.03 + Math.random() * 0.05,
        y: (Math.random() - 0.5) * 0.6,
        scale: 0.03 + Math.random() * 0.09,
        spin: Math.random() * 2,
        rx: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    const dt = delta * timeScale
    const mesh = meshRef.current
    if (!mesh) return
    rocks.forEach((r, i) => {
      r.angle += dt * r.speed
      const x = Math.cos(r.angle) * r.radius
      const z = Math.sin(r.angle) * r.radius
      dummy.position.set(x, r.y, z)
      dummy.rotation.set(r.rx + r.angle * r.spin, r.angle * r.spin, r.rz)
      dummy.scale.setScalar(r.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8b8378" roughness={1} metalness={0.1} />
    </instancedMesh>
  )
}
