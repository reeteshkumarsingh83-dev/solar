import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

// On tall (portrait/mobile) screens the horizontal view gets very narrow, so widen the
// field of view and return a distance multiplier to pull the camera back.
export function useResponsiveCamera({ baseFov = 50, portraitFov = 70 } = {}) {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const portrait = aspect < 1

  useEffect(() => {
    camera.fov = portrait ? portraitFov : baseFov
    camera.updateProjectionMatrix()
  }, [camera, portrait, baseFov, portraitFov])

  return portrait ? Math.min(2.4, 1.05 / aspect) : 1
}
