import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const tmpPos = new THREE.Vector3()

export default function CameraRig({ getFocusPosition, focusDistance, controlsRef }) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    if (!controlsRef.current) return
    const controls = controlsRef.current
    const target = getFocusPosition ? getFocusPosition() : new THREE.Vector3(0, 0, 0)

    controls.target.lerp(target, Math.min(1, delta * 2.5))

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target)
    if (dir.lengthSq() < 0.0001) dir.set(0, 0.3, 1)
    dir.normalize()
    tmpPos.copy(controls.target).addScaledVector(dir, focusDistance || 6)
    camera.position.lerp(tmpPos, Math.min(1, delta * 1.8))

    controls.update()
  })

  return null
}
