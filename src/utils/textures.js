import * as THREE from 'three'

// Simple seeded random for repeatable noise
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(size = 512) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size / 2
  return c
}

function toTexture(c) {
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

// Earth-like nature globe: oceans, continents, polar ice
export function makeEarthTexture(seed = 7) {
  const rand = mulberry32(seed)
  const c = canvas(1024)
  const ctx = c.getContext('2d')
  const w = c.width, h = c.height

  // Ocean base gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, h)
  ocean.addColorStop(0, '#0a3d62')
  ocean.addColorStop(0.5, '#1e6091')
  ocean.addColorStop(1, '#0a3d62')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, w, h)

  // Continents (irregular blobs)
  const greens = ['#2d6a3f', '#3d8b52', '#4f9d5f', '#6ba85a']
  for (let i = 0; i < 26; i++) {
    const cx = rand() * w
    const cy = h * 0.15 + rand() * h * 0.7
    const rw = 40 + rand() * 140
    const rh = 25 + rand() * 80
    ctx.fillStyle = greens[Math.floor(rand() * greens.length)]
    ctx.beginPath()
    ctx.ellipse(cx, cy, rw, rh, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
    // wrap around edges
    ctx.beginPath()
    ctx.ellipse(cx - w, cy, rw, rh, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + w, cy, rw, rh, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Desert/plains patches
  ctx.fillStyle = 'rgba(196,164,90,0.35)'
  for (let i = 0; i < 10; i++) {
    const cx = rand() * w
    const cy = h * 0.3 + rand() * h * 0.4
    ctx.beginPath()
    ctx.ellipse(cx, cy, 30 + rand() * 60, 15 + rand() * 30, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Polar ice caps
  const iceGrad = ctx.createLinearGradient(0, 0, 0, h * 0.12)
  iceGrad.addColorStop(0, '#ffffff')
  iceGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = iceGrad
  ctx.fillRect(0, 0, w, h * 0.14)
  ctx.save()
  ctx.translate(0, h)
  ctx.scale(1, -1)
  ctx.fillStyle = iceGrad
  ctx.fillRect(0, 0, w, h * 0.14)
  ctx.restore()

  return toTexture(c)
}

export function makeCloudsTexture(seed = 3) {
  const rand = mulberry32(seed)
  const c = canvas(1024)
  const ctx = c.getContext('2d')
  const w = c.width, h = c.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  for (let i = 0; i < 90; i++) {
    const cx = rand() * w
    const cy = rand() * h
    const rw = 15 + rand() * 60
    const rh = 8 + rand() * 20
    ctx.globalAlpha = 0.2 + rand() * 0.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, rw, rh, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = toTexture(c)
  tex.transparent = true
  return tex
}

// Generic banded gas-giant / rocky texture
export function makeBandedTexture(colors, seed = 1, bands = 12) {
  const rand = mulberry32(seed)
  const c = canvas(512)
  const ctx = c.getContext('2d')
  const w = c.width, h = c.height
  for (let y = 0; y < h; y++) {
    const t = y / h
    const bandIdx = Math.floor(t * bands + Math.sin(t * 30 + seed) * 0.6)
    const color = colors[Math.abs(bandIdx) % colors.length]
    ctx.fillStyle = color
    ctx.fillRect(0, y, w, 1)
  }
  // add turbulence streaks
  for (let i = 0; i < 200; i++) {
    const y = rand() * h
    const x = rand() * w
    const len = 20 + rand() * 100
    ctx.strokeStyle = `rgba(255,255,255,${0.03 + rand() * 0.06})`
    ctx.lineWidth = 1 + rand() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y + (rand() - 0.5) * 6)
    ctx.stroke()
  }
  return toTexture(c)
}

export function makeRockyTexture(baseColor, accentColor, seed = 5) {
  const rand = mulberry32(seed)
  const c = canvas(512)
  const ctx = c.getContext('2d')
  const w = c.width, h = c.height
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = accentColor
  for (let i = 0; i < 350; i++) {
    const cx = rand() * w
    const cy = rand() * h
    const r = 2 + rand() * 10
    ctx.globalAlpha = 0.15 + rand() * 0.3
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return toTexture(c)
}

export function makeSunTexture(seed = 9) {
  const rand = mulberry32(seed)
  const c = canvas(512)
  const ctx = c.getContext('2d')
  const w = c.width, h = c.height
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#fff6c8')
  grad.addColorStop(0.5, '#ffcf4d')
  grad.addColorStop(1, '#ff8c1a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 500; i++) {
    const cx = rand() * w
    const cy = rand() * h
    const r = 1 + rand() * 4
    ctx.fillStyle = `rgba(255,${140 + rand() * 100},0,${0.2 + rand() * 0.3})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return toTexture(c)
}

export function makeNebulaTexture(seed = 42) {
  const rand = mulberry32(seed)
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#03040a'
  ctx.fillRect(0, 0, c.width, c.height)

  const palettes = [
    ['rgba(120,60,200,0.5)', 'rgba(120,60,200,0)'],
    ['rgba(40,90,200,0.45)', 'rgba(40,90,200,0)'],
    ['rgba(200,60,140,0.4)', 'rgba(200,60,140,0)'],
    ['rgba(60,180,190,0.3)', 'rgba(60,180,190,0)'],
  ]

  for (let i = 0; i < 14; i++) {
    const cx = rand() * c.width
    const cy = rand() * c.height
    const r = 80 + rand() * 220
    const [inner, outer] = palettes[Math.floor(rand() * palettes.length)]
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, inner)
    grad.addColorStop(1, outer)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // scattered faint stars within nebula texture
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  for (let i = 0; i < 300; i++) {
    const x = rand() * c.width
    const y = rand() * c.height
    const r = rand() * 1.2
    ctx.globalAlpha = 0.3 + rand() * 0.6
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

export function makeRingTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 8
  const ctx = c.getContext('2d')
  for (let x = 0; x < c.width; x++) {
    const t = x / c.width
    const alpha = 0.15 + 0.5 * Math.abs(Math.sin(t * 40)) * (1 - Math.abs(t - 0.5) * 1.4)
    ctx.fillStyle = `rgba(210,190,160,${Math.max(0, alpha)})`
    ctx.fillRect(x, 0, 1, c.height)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}
