// Procedural terrain for Jammu & Kashmir, shaped roughly after real geography:
// Jammu plains (south) → Shivalik foothills → Pir Panjal range → Kashmir valley → Great Himalaya (north).

export const CENTER_LON = 74.9
export const CENTER_LAT = 33.75
export const UNITS_PER_DEG = 42 // horizontal scale
export const UNITS_PER_KM = 2.2 // vertical scale (exaggerated)
export const TERRAIN_SIZE = 120

export const lonLatToXZ = (lon, lat) => [
  (lon - CENTER_LON) * UNITS_PER_DEG,
  -(lat - CENTER_LAT) * UNITS_PER_DEG,
]
export const xzToLonLat = (x, z) => [CENTER_LON + x / UNITS_PER_DEG, CENTER_LAT - z / UNITS_PER_DEG]

function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function fbm(x, y, octaves = 5) {
  let sum = 0, amp = 0.5, norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x, y) * amp
    norm += amp
    x *= 2.03; y *= 2.03; amp *= 0.5
  }
  return sum / norm
}

function ridged(x, y, octaves = 6) {
  let sum = 0, amp = 0.5, norm = 0, weight = 1
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(valueNoise(x, y) * 2 - 1)
    n *= n * weight
    weight = Math.min(1, n * 2)
    sum += n * amp
    norm += amp
    x *= 2.1; y *= 2.1; amp *= 0.5
  }
  return sum / norm
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const gauss = (v, mu, s) => Math.exp(-((v - mu) ** 2) / (2 * s * s))

export const LAKES = [
  { name: 'Dal Lake', lon: 74.86, lat: 34.11, r: 0.045 },
  { name: 'Wular Lake', lon: 74.6, lat: 34.36, r: 0.07 },
]

// Elevation in km
export function heightKm(lon, lat) {
  // across-range coordinate: ranges run roughly NW–SE
  const v = lat + 0.35 * (lon - CENTER_LON)

  const base = 0.3 + 1.3 * smoothstep(32.8, 33.35, v)
  const shivalik = 0.6 * gauss(v, 33.12, 0.13)
  const pirPanjal = 2.7 * gauss(v, 33.6, 0.2)
  const himalaya = 3.2 * smoothstep(34.35, 34.8, v)
  const mountain = clamp((pirPanjal + himalaya) / 2.8, 0, 1)

  const r = ridged(lon * 6, lat * 6)
  const n = fbm(lon * 14, lat * 14, 4)

  let h =
    base +
    shivalik * (0.5 + r) +
    pirPanjal * (0.55 + 0.6 * r) +
    himalaya * (0.5 + 0.7 * r) +
    mountain * r * 1.2 +
    (n - 0.5) * 0.25

  for (const l of LAKES) {
    const d = Math.hypot(lon - l.lon, lat - l.lat)
    h -= 0.22 * gauss(d, 0, l.r)
  }
  return h
}

export const heightUnits = (x, z) => {
  const [lon, lat] = xzToLonLat(x, z)
  return heightKm(lon, lat) * UNITS_PER_KM
}
