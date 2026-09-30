import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, Html } from '@react-three/drei'
import * as THREE from 'three'
import PhotoPostcard from './PhotoPostcard'
import {
  TERRAIN_SIZE,
  UNITS_PER_KM,
  UNITS_PER_DEG,
  LAKES,
  lonLatToXZ,
  xzToLonLat,
  heightKm,
  heightUnits,
  fbm,
  smoothstep,
} from '../utils/kashmirTerrain'

export const KASHMIR_PLACES = [
  { key: 'srinagar', name: 'Srinagar', lon: 74.8, lat: 34.08, info: 'Summer capital on the banks of the Jhelum, home to Dal Lake and its houseboats. Winters bring snow and the famous Chillai Kalan cold spell.' },
  { key: 'gulmarg', name: 'Gulmarg', lon: 74.38, lat: 34.05, info: '"Meadow of flowers" on the Pir Panjal slopes — a top ski destination with one of the highest cable cars in the world (Apharwat, ~3,980 m).' },
  { key: 'sonamarg', name: 'Sonamarg', lon: 75.29, lat: 34.3, info: '"Meadow of gold" at ~2,800 m, gateway to the Thajiwas glacier and the Zoji La pass towards Ladakh.' },
  { key: 'pahalgam', name: 'Pahalgam', lon: 75.32, lat: 34.01, info: 'Lidder valley town surrounded by pine forests and snow peaks; base for the Amarnath Yatra.' },
  { key: 'katra', name: 'Katra (Vaishno Devi)', lon: 74.93, lat: 32.99, info: 'Foothill town in the Trikuta mountains, base for the Mata Vaishno Devi shrine.' },
  { key: 'jammu', name: 'Jammu', lon: 74.86, lat: 32.73, info: 'Winter capital, "City of Temples", on the Tawi river in the plains south of the Pir Panjal.' },
  { key: 'postcard', name: '📷 Winter Postcard', lon: 74.95, lat: 34.11, postcard: true, focusY: 5, offset: [9, 1.5, 2], info: 'A winter memory framed on the shore of Dal Lake, Srinagar — with snow settling on the frame.' },
]

const POSTCARD = KASHMIR_PLACES.find((p) => p.postcard)

export function placePosition(p) {
  const [x, z] = lonLatToXZ(p.lon, p.lat)
  return new THREE.Vector3(x, heightUnits(x, z), z)
}

/* ---------- textures ---------- */

function softDotTexture(size = 64, inner = 0.2) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(inner, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ---------- terrain ---------- */

const SEGMENTS = 320
const C = {
  plains: new THREE.Color('#7d8a52'),
  valley: new THREE.Color('#7f9163'),
  forest: new THREE.Color('#2e4a34'),
  rock: new THREE.Color('#6b645e'),
  snow: new THREE.Color('#f3f7ff'),
  snowShade: new THREE.Color('#c9d6ea'),
}

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, heightUnits(pos.getX(i), pos.getZ(i)))
    }
    geo.computeVertexNormals()

    const normals = geo.attributes.normal
    const colors = new Float32Array(pos.count * 3)
    const col = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = pos.getY(i) / UNITS_PER_KM
      const slope = 1 - normals.getY(i)
      const [lon, lat] = xzToLonLat(x, z)
      const n = fbm(lon * 20, lat * 20, 3)

      // low land: plains → valley → forest
      col.copy(C.plains).lerp(C.valley, smoothstep(0.6, 1.4, h))
      col.lerp(C.forest, smoothstep(1.9, 2.3, h) * 0.9)
      // winter frost in the valley
      col.lerp(C.snow, smoothstep(1.2, 1.7, h) * smoothstep(0.45, 0.7, n) * 0.55)
      // snow above the snow line, rock on steep faces
      const snowLine = 2.45 + (n - 0.5) * 0.5
      const snow = smoothstep(snowLine - 0.15, snowLine + 0.15, h)
      const steep = smoothstep(0.35, 0.6, slope)
      const snowCol = C.snow.clone().lerp(C.snowShade, slope * 0.8)
      col.lerp(C.rock, snow * steep)
      col.lerp(snowCol, snow * (1 - steep))

      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
    </mesh>
  )
}

function Lakes() {
  return LAKES.map((l) => {
    const [x, z] = lonLatToXZ(l.lon, l.lat)
    const level = (heightKm(l.lon, l.lat) + 0.14) * UNITS_PER_KM
    return (
      <mesh key={l.name} position={[x, level, z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[l.r * UNITS_PER_DEG * 1.6, 48]} />
        <meshStandardMaterial color="#5f8fb0" roughness={0.15} metalness={0.3} transparent opacity={0.92} />
      </mesh>
    )
  })
}

/* ---------- weather ---------- */

const SNOW_COUNT = 9000
const SNOW_BOX = { w: 90, h: 40, d: 90 }

function Snowfall({ controlsRef }) {
  const groupRef = useRef()
  const tex = useMemo(() => softDotTexture(32, 0.35), [])
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(SNOW_COUNT * 3)
    const speeds = new Float32Array(SNOW_COUNT)
    for (let i = 0; i < SNOW_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SNOW_BOX.w
      positions[i * 3 + 1] = Math.random() * SNOW_BOX.h
      positions[i * 3 + 2] = (Math.random() - 0.5) * SNOW_BOX.d
      speeds[i] = 1.2 + Math.random() * 1.6
    }
    return { positions, speeds }
  }, [])
  const geoRef = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const arr = geoRef.current.attributes.position.array
    for (let i = 0; i < SNOW_COUNT; i++) {
      const i3 = i * 3
      arr[i3 + 1] -= speeds[i] * dt
      arr[i3] += (Math.sin(t * 0.7 + i) * 0.4 + 0.6) * dt // wind drift
      arr[i3 + 2] += Math.cos(t * 0.5 + i * 1.3) * 0.3 * dt
      if (arr[i3 + 1] < -8) {
        arr[i3 + 1] = SNOW_BOX.h
        arr[i3] = (Math.random() - 0.5) * SNOW_BOX.w
        arr[i3 + 2] = (Math.random() - 0.5) * SNOW_BOX.d
      }
      if (arr[i3] > SNOW_BOX.w / 2) arr[i3] -= SNOW_BOX.w
    }
    geoRef.current.attributes.position.needsUpdate = true
    // keep the snow volume around whatever the camera is looking at
    if (controlsRef.current && groupRef.current) {
      const target = controlsRef.current.target
      groupRef.current.position.set(target.x, target.y - 4, target.z)
    }
  })

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={tex}
          size={0.35}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.95}
          color="#ffffff"
        />
      </points>
    </group>
  )
}

function Clouds({ count = 22 }) {
  const tex = useMemo(() => softDotTexture(128, 0.1), [])
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const low = i % 3 === 0 // some clouds hug the mountain tops
        return {
          x: (Math.random() - 0.5) * 140,
          y: low ? 9 + Math.random() * 4 : 16 + Math.random() * 7,
          z: (Math.random() - 0.5) * 120,
          speed: 0.6 + Math.random() * 0.9,
          puffs: Array.from({ length: 9 + Math.floor(Math.random() * 6) }, () => ({
            p: [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6],
            s: 5 + Math.random() * 6,
            o: 0.35 + Math.random() * 0.3,
          })),
        }
      }),
    [count]
  )
  const refs = useRef([])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    refs.current.forEach((g, i) => {
      if (!g) return
      g.position.x += clouds[i].speed * dt
      if (g.position.x > 80) g.position.x = -80
    })
  })

  return clouds.map((c, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} position={[c.x, c.y, c.z]}>
      {c.puffs.map((p, j) => (
        <sprite key={j} position={p.p} scale={[p.s, p.s * 0.6, 1]}>
          <spriteMaterial map={tex} transparent opacity={p.o} depthWrite={false} color="#f4f6fa" />
        </sprite>
      ))}
    </group>
  ))
}

/* ---------- markers & camera ---------- */

function Markers({ selected, onSelect }) {
  return KASHMIR_PLACES.filter((p) => !p.postcard).map((p) => {
    const pos = placePosition(p)
    const active = selected?.key === p.key
    return (
      <group key={p.key} position={pos}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
          <meshBasicMaterial color={active ? '#ffb23c' : '#ff5a5a'} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color={active ? '#ffb23c' : '#ff5a5a'} />
        </mesh>
        <Html position={[0, 2.6, 0]} center zIndexRange={[10, 0]}>
          <button className={`kmr-pin ${active ? 'active' : ''}`} onClick={() => onSelect(p)}>
            {p.name}
          </button>
        </Html>
      </group>
    )
  })
}

const OVERVIEW_TARGET = new THREE.Vector3(0, 4, 0)
const OVERVIEW_OFFSET = new THREE.Vector3(0, 48, 70)
const PLACE_OFFSET = new THREE.Vector3(6, 9, 14)

function FlyRig({ selected, controlsRef }) {
  const flying = useRef(true)
  const target = useRef(OVERVIEW_TARGET.clone())
  const camGoal = useRef(OVERVIEW_TARGET.clone().add(OVERVIEW_OFFSET))

  useEffect(() => {
    if (selected) {
      target.current.copy(placePosition(selected))
      target.current.y += selected.focusY || 0
      camGoal.current
        .copy(target.current)
        .add(selected.offset ? new THREE.Vector3(...selected.offset) : PLACE_OFFSET)
    } else {
      target.current.copy(OVERVIEW_TARGET)
      camGoal.current.copy(OVERVIEW_TARGET).add(OVERVIEW_OFFSET)
    }
    flying.current = true
  }, [selected])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const stop = () => (flying.current = false)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controlsRef])

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current
    if (!controls || !flying.current) return
    const k = Math.min(1, delta * 2)
    controls.target.lerp(target.current, k)
    camera.position.lerp(camGoal.current, k)
    controls.update()
    if (camera.position.distanceTo(camGoal.current) < 0.05) flying.current = false
  })

  return null
}

export default function KashmirScene({ selected, onSelect, showSnow, showClouds }) {
  const controlsRef = useRef()

  return (
    <Canvas
      shadows
      camera={{ position: [0, 60, 95], fov: 50, near: 0.1, far: 3000 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#c8d3e0']} />
      <fog attach="fog" args={['#cdd6e2', 55, 175]} />
      <Sky distance={1500} sunPosition={[80, 25, -60]} turbidity={9} rayleigh={1.2} mieCoefficient={0.01} mieDirectionalG={0.8} />

      <hemisphereLight args={['#e3ecf8', '#4a4f5c', 0.75]} />
      <directionalLight
        position={[60, 70, -40]}
        intensity={1.6}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={250}
      />

      <Terrain />
      <Lakes />
      <Markers selected={selected} onSelect={onSelect} />
      <PhotoPostcard position={placePosition(POSTCARD)} onSelect={() => onSelect(POSTCARD)} />
      {showClouds && <Clouds />}
      {showSnow && <Snowfall controlsRef={controlsRef} />}

      <OrbitControls
        ref={controlsRef}
        enablePan
        minDistance={4}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.15}
      />
      <FlyRig selected={selected} controlsRef={controlsRef} />
    </Canvas>
  )
}
