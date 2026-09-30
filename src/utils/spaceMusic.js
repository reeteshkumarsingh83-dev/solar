// Generative ambient "space" music built entirely with the Web Audio API:
// slow evolving pad chords, a deep drone, and random twinkling bell notes, all through a long reverb.

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

// Am9 → Fmaj7 → Cmaj9 → G6sus
const CHORDS = [
  [57, 64, 71, 72, 79],
  [53, 60, 64, 69, 76],
  [60, 67, 71, 74, 79],
  [55, 62, 69, 74, 76],
]
const BELL_NOTES = [69, 72, 74, 76, 79, 81, 84, 86, 88] // A minor pentatonic, high
const CHORD_SECONDS = 9

function makeImpulse(ctx, seconds = 6, decay = 2.6) {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

export function createSpaceMusic() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()

  const master = ctx.createGain()
  master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  const reverb = ctx.createConvolver()
  reverb.buffer = makeImpulse(ctx)
  const wet = ctx.createGain()
  wet.gain.value = 0.9
  reverb.connect(wet).connect(master)

  const dry = ctx.createGain()
  dry.gain.value = 0.45
  dry.connect(master)

  // shared pad filter with a slow "breathing" LFO
  const padFilter = ctx.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 1800
  padFilter.Q.value = 0.7
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 0.05
  lfoGain.gain.value = 700
  lfo.connect(lfoGain).connect(padFilter.frequency)
  lfo.start()
  padFilter.connect(dry)
  padFilter.connect(reverb)

  // deep drone
  const drone = ctx.createOscillator()
  const droneGain = ctx.createGain()
  drone.type = 'sine'
  drone.frequency.value = midiToFreq(45)
  droneGain.gain.value = 0.1
  drone.connect(droneGain).connect(dry)
  droneGain.connect(reverb)
  drone.start()

  let chordIndex = 0
  let chordTimer = null
  let bellTimer = null

  function playChord(notes, when) {
    const attack = 3.5
    const hold = CHORD_SECONDS - 1
    const release = 5
    notes.forEach((m) => {
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(0.11, when + attack)
      env.gain.setValueAtTime(0.11, when + hold)
      env.gain.linearRampToValueAtTime(0, when + hold + release)
      env.connect(padFilter)
      for (const detune of [-7, 7]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = midiToFreq(m)
        osc.detune.value = detune
        osc.connect(env)
        osc.start(when)
        osc.stop(when + hold + release + 0.1)
      }
    })
  }

  function playBell() {
    const when = ctx.currentTime + 0.05
    const m = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)]
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, when)
    env.gain.linearRampToValueAtTime(0.16, when + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, when + 4)
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.6 - 0.8
    env.connect(pan)
    pan.connect(reverb)
    pan.connect(dry)
    // sine + soft overtone for a glassy bell
    ;[1, 2.76].forEach((ratio, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = midiToFreq(m) * ratio
      g.gain.value = i === 0 ? 1 : 0.25
      osc.connect(g).connect(env)
      osc.start(when)
      osc.stop(when + 4.2)
    })
    bellTimer = setTimeout(playBell, 1500 + Math.random() * 3500)
  }

  function nextChord() {
    playChord(CHORDS[chordIndex], ctx.currentTime + 0.05)
    chordIndex = (chordIndex + 1) % CHORDS.length
    chordTimer = setTimeout(nextChord, CHORD_SECONDS * 1000)
  }

  let volume = 1
  let running = false

  return {
    start() {
      if (running) return
      running = true
      // must be called synchronously inside a user gesture (click/key) for browsers to allow audio
      ctx.resume()
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5)
      nextChord()
      bellTimer = setTimeout(playBell, 2500)
    },
    stop() {
      if (!running) return
      running = false
      clearTimeout(chordTimer)
      clearTimeout(bellTimer)
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
      setTimeout(() => !running && ctx.suspend(), 1600)
    },
    setVolume(v) {
      volume = v
      if (running) master.gain.setTargetAtTime(v, ctx.currentTime, 0.2)
    },
    dispose() {
      clearTimeout(chordTimer)
      clearTimeout(bellTimer)
      ctx.close()
    },
  }
}
