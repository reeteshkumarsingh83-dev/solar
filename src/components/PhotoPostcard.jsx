import { useEffect, useState } from 'react'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import photoUrl from '../assets/kashmir-portrait.jpg'

const W = 800
const H = 1000
const PAD = 38
const PHOTO_H = 800

// Turns the raw photo into a frosty "winter postcard": cool colour grade,
// vignette, falling snow, frosted polaroid frame and a caption.
function buildPostcard(img) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')

  // frame: off-white with an icy gradient
  const frame = ctx.createLinearGradient(0, 0, W, H)
  frame.addColorStop(0, '#ffffff')
  frame.addColorStop(1, '#e4eefb')
  ctx.fillStyle = frame
  ctx.fillRect(0, 0, W, H)

  // photo, cover-cropped and biased towards the top (face)
  const pw = W - PAD * 2
  const ph = PHOTO_H - PAD
  const scale = Math.max(pw / img.width, ph / img.height)
  const sw = pw / scale
  const sh = ph / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) * 0.15
  ctx.save()
  ctx.beginPath()
  ctx.rect(PAD, PAD, pw, ph)
  ctx.clip()
  ctx.filter = 'saturate(1.05) contrast(1.06) brightness(1.05)'
  ctx.drawImage(img, sx, sy, sw, sh, PAD, PAD, pw, ph)
  ctx.filter = 'none'

  // cool winter tint
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = 'rgba(150, 190, 255, 0.35)'
  ctx.fillRect(PAD, PAD, pw, ph)
  ctx.globalCompositeOperation = 'source-over'

  // soft light leak from the top
  const leak = ctx.createLinearGradient(0, PAD, 0, PAD + ph * 0.35)
  leak.addColorStop(0, 'rgba(255,255,255,0.28)')
  leak.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = leak
  ctx.fillRect(PAD, PAD, pw, ph)

  // vignette
  const vig = ctx.createRadialGradient(W / 2, PAD + ph * 0.42, ph * 0.3, W / 2, PAD + ph / 2, ph * 0.78)
  vig.addColorStop(0, 'rgba(10,20,40,0)')
  vig.addColorStop(1, 'rgba(10,20,40,0.45)')
  ctx.fillStyle = vig
  ctx.fillRect(PAD, PAD, pw, ph)

  // falling snow over the photo
  let seed = 11
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 260; i++) {
    const x = PAD + rand() * pw
    const y = PAD + rand() * ph
    const r = 0.8 + rand() * rand() * 4.5
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.6 + rand() * 0.4})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // snow settling along the bottom edge of the photo
  const drift = ctx.createLinearGradient(0, PAD + ph - 40, 0, PAD + ph)
  drift.addColorStop(0, 'rgba(255,255,255,0)')
  drift.addColorStop(1, 'rgba(255,255,255,0.55)')
  ctx.fillStyle = drift
  ctx.fillRect(PAD, PAD + ph - 40, pw, 40)
  ctx.restore()

  // frosted corners on the frame
  for (const [fx, fy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
    const f = ctx.createRadialGradient(fx, fy, 0, fx, fy, 160)
    f.addColorStop(0, 'rgba(190,215,245,0.75)')
    f.addColorStop(1, 'rgba(190,215,245,0)')
    ctx.fillStyle = f
    ctx.fillRect(0, 0, W, H)
  }

  // caption
  ctx.fillStyle = '#2b4a6f'
  ctx.textAlign = 'center'
  ctx.font = 'italic 600 58px "Segoe Script", "Brush Script MT", cursive'
  ctx.fillText('Winter in Kashmir', W / 2, PHOTO_H + 95)
  ctx.font = '500 26px "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = '#6a86a8'
  ctx.fillText('❄  Dal Lake · Srinagar  ❄', W / 2, PHOTO_H + 145)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export default function PhotoPostcard({ position, onSelect }) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    let tex
    const img = new Image()
    img.onload = () => {
      tex = buildPostcard(img)
      setTexture(tex)
    }
    img.src = photoUrl
    return () => tex?.dispose()
  }, [])

  const w = 4
  const h = w * (H / W)

  return (
    <group position={position}>
      {/* wooden post */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 2.4, 8]} />
        <meshStandardMaterial color="#5a3d26" roughness={0.9} />
      </mesh>
      <Billboard position={[0, 2.4 + h / 2, 0]} lockX lockZ>
        <group onClick={(e) => { e.stopPropagation(); onSelect?.() }}>
          {/* wooden backing */}
          <mesh position={[0, 0, -0.06]} castShadow>
            <boxGeometry args={[w + 0.3, h + 0.3, 0.1]} />
            <meshStandardMaterial color="#6b4a2f" roughness={0.85} />
          </mesh>
          {/* snow resting on top of the frame */}
          <mesh position={[0, h / 2 + 0.18, -0.04]} rotation-z={Math.PI / 2} scale={[0.35, 1, 0.5]}>
            <capsuleGeometry args={[0.28, w - 0.2, 6, 12]} />
            <meshStandardMaterial color="#f5f9ff" roughness={1} />
          </mesh>
          {texture && (
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial map={texture} roughness={0.6} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.25} />
            </mesh>
          )}
        </group>
      </Billboard>
      <pointLight position={[0, 2.4 + h / 2, 2.5]} intensity={6} distance={10} color="#ffe2b8" />
    </group>
  )
}
