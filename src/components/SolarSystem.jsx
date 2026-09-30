import { useRef, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Sun from './Sun'
import Planet from './Planet'
import Earth from './Earth'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import Nebula from './Nebula'
import AsteroidBelt from './AsteroidBelt'
import TimeKeeper from './TimeKeeper'
import { planetsData, sunData } from '../data/planets'
import { useResponsiveCamera } from '../utils/useResponsiveCamera'

function Scene({ selected, onSelect, controlsRef, timeScale, onTick }) {
  const zoomOut = useResponsiveCamera()
  const angleRefs = useRef(planetsData.map(() => ({ current: Math.random() * Math.PI * 2 })))

  const getFocusPosition = useMemo(() => {
    return () => {
      if (!selected || selected.name === 'Sun') return new THREE.Vector3(0, 0, 0)
      const idx = planetsData.findIndex((p) => p.key === selected.key)
      if (idx === -1) return new THREE.Vector3(0, 0, 0)
      const angle = angleRefs.current[idx].current
      const d = planetsData[idx].distance
      return new THREE.Vector3(Math.cos(angle) * d, 0, Math.sin(angle) * d)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const focusDistance = selected
    ? selected.name === 'Sun'
      ? sunData.size * 3.2 * Math.min(zoomOut, 1.6)
      : (selected.size * 6 + 2) * Math.min(zoomOut, 1.6)
    : 55 * zoomOut

  return (
    <>
      <ambientLight intensity={0.15} />
      <Nebula />
      <Stars radius={200} depth={80} count={6000} factor={4} saturation={0} fade speed={0.5} />

      <Sun onSelect={onSelect} selected={selected} timeScale={timeScale} />

      <AsteroidBelt timeScale={timeScale} />

      {planetsData.map((p, i) => (
        <group key={p.key}>
          <OrbitPath radius={p.distance} />
          {p.isEarth ? (
            <Earth data={p} angleRef={angleRefs.current[i]} onSelect={onSelect} selected={selected} timeScale={timeScale} />
          ) : (
            <Planet data={p} angleRef={angleRefs.current[i]} onSelect={onSelect} selected={selected} timeScale={timeScale} />
          )}
        </group>
      ))}

      <TimeKeeper timeScale={timeScale} onTick={onTick} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={4}
        maxDistance={200}
        autoRotate={!selected}
        autoRotateSpeed={0.15}
      />
      <CameraRig getFocusPosition={getFocusPosition} focusDistance={focusDistance} controlsRef={controlsRef} />

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.7} />
      </EffectComposer>
    </>
  )
}

export default function SolarSystem({ selected, onSelect, timeScale, onTick }) {
  const controlsRef = useRef()

  return (
    <Canvas
      camera={{ position: [0, 22, 55], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 70, 220]} />
      <Suspense fallback={null}>
        <Scene
          selected={selected}
          onSelect={onSelect}
          controlsRef={controlsRef}
          timeScale={timeScale}
          onTick={onTick}
        />
      </Suspense>
    </Canvas>
  )
}
