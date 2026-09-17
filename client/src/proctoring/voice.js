// Microphone monitoring: lightweight on-device voice activity detection (no audio is recorded or uploaded).
// A frame counts as speech when energy in the human-voice band (300–3400 Hz) rises clearly above the
// calibrated room noise, the spectrum is not flat (noise) and not a single pure tone (beeps, fans, alarms).

const VOICE_LOW_HZ = 300;
const VOICE_HIGH_HZ = 3400;
const FRAME_MS = 100;
const WINDOW_FRAMES = 20;          // 2 s rolling window
const SPEECH_FRAMES_REQUIRED = 9;  // ≈ 0.9 s of speech inside the window
const MARGIN_DB = 10;              // above noise floor

export class VoiceMonitor {
  constructor(stream) {
    this.stream = stream;
    this.ctx = null;
    this.analyser = null;
    this.timer = null;
    this.noiseFloorDb = -70;
    this.frames = [];
    this.level = 0;
    this.speaking = false;
    this.speechStartedAt = null;
    this.listeners = new Set();
  }

  async start() {
    const track = this.stream?.getAudioTracks?.()[0];
    if (!track) throw new Error('No microphone track');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    const source = this.ctx.createMediaStreamSource(new MediaStream([track]));
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.2;
    source.connect(this.analyser);
    this.freq = new Float32Array(this.analyser.frequencyBinCount);
    this.timer = setInterval(() => this.tick(), FRAME_MS);
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
  }

  resume() {
    if (this.ctx?.state === 'suspended') return this.ctx.resume().catch(() => {});
    return Promise.resolve();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  analyseFrame() {
    this.analyser.getFloatFrequencyData(this.freq); // dB values
    const binHz = this.ctx.sampleRate / this.analyser.fftSize;
    const lo = Math.max(1, Math.floor(VOICE_LOW_HZ / binHz));
    const hi = Math.min(this.freq.length - 1, Math.ceil(VOICE_HIGH_HZ / binHz));

    let bandPower = 0;
    let totalPower = 0;
    let peak = 0;
    let logSum = 0;
    let n = 0;
    for (let i = 1; i < this.freq.length; i++) {
      const p = 10 ** (this.freq[i] / 10);
      totalPower += p;
      if (i >= lo && i <= hi) {
        bandPower += p;
        peak = Math.max(peak, p);
        logSum += Math.log(p + 1e-20);
        n++;
      }
    }
    const bandDb = 10 * Math.log10(bandPower + 1e-20);
    const flatness = n ? Math.exp(logSum / n) / (bandPower / n + 1e-20) : 1; // 1 = white noise, 0 = tonal
    const peakRatio = bandPower ? peak / bandPower : 1; // close to 1 = single pure tone
    const bandRatio = totalPower ? bandPower / totalPower : 0;
    return { bandDb, flatness, peakRatio, bandRatio };
  }

  // Measure the room's background noise for `ms` milliseconds (call during system check)
  async calibrate(ms = 2500) {
    const samples = [];
    const end = Date.now() + ms;
    while (Date.now() < end) {
      await new Promise(r => setTimeout(r, FRAME_MS));
      if (this.analyser) samples.push(this.analyseFrame().bandDb);
    }
    if (samples.length) {
      samples.sort((a, b) => a - b);
      this.noiseFloorDb = samples[Math.floor(samples.length * 0.6)];
    }
    return this.noiseFloorDb;
  }

  tick() {
    if (!this.analyser) return;
    const { bandDb, flatness, peakRatio, bandRatio } = this.analyseFrame();
    // slowly adapt the noise floor downward / upward to room changes (only when quiet)
    const isSpeechFrame = bandDb > this.noiseFloorDb + MARGIN_DB && flatness < 0.5 && peakRatio < 0.3 && bandRatio > 0.3;
    if (!isSpeechFrame && bandDb < this.noiseFloorDb + 3) this.noiseFloorDb = this.noiseFloorDb * 0.98 + bandDb * 0.02;

    this.level = Math.max(0, Math.min(1, (bandDb - this.noiseFloorDb) / 30));
    this.frames.push(isSpeechFrame);
    if (this.frames.length > WINDOW_FRAMES) this.frames.shift();
    const speechCount = this.frames.filter(Boolean).length;

    const wasSpeaking = this.speaking;
    this.speaking = speechCount >= SPEECH_FRAMES_REQUIRED || (wasSpeaking && speechCount >= 4);
    if (this.speaking && !wasSpeaking) this.speechStartedAt = Date.now();
    if (!this.speaking) this.speechStartedAt = null;
    this.listeners.forEach(fn => fn({ speaking: this.speaking, level: this.level, since: this.speechStartedAt }));
  }

  isTrackLive() {
    const t = this.stream?.getAudioTracks?.()[0];
    return Boolean(t && t.readyState === 'live' && t.enabled && !t.muted);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.listeners.clear();
    try { this.ctx?.close(); } catch (_) { /* ignore */ }
    this.ctx = null;
    this.analyser = null;
  }
}
