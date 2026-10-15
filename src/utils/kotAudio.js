/**
 * KOT (Kitchen Order Ticket) Loud Ringing Audio Synthesizer
 *
 * Implements a high-penetration, realistic 3-second loud ringing bell / kitchen alarm.
 * If multiple orders arrive simultaneously, it rings consecutively for each order
 * (e.g., 2 simultaneous orders -> rings 2 times for 3 seconds each with a clean pause).
 */

class KOTAudioController {
  constructor() {
    this.ctx = null;
    this.isRinging = false;
    this.pendingRings = 0;
    this.stopRequested = false;
    this.activeNodes = [];
    this.listeners = new Set();
  }

  getAudioContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  async resumeContext() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }
    return ctx;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(isRinging, remainingCount = 0) {
    this.listeners.forEach((cb) => {
      try {
        cb({ isRinging, remainingCount });
      } catch (e) {
        console.error('Error in audio state listener:', e);
      }
    });
  }

  /**
   * Synthesize a single loud 3-second ringing burst
   * Uses dual resonant telephone/alarm bell frequencies (853Hz + 960Hz),
   * rapid 16Hz amplitude modulation, and compressor for maximum clarity and loudness.
   */
  playSingle3SecRing(ctx) {
    return new Promise((resolve) => {
      if (this.stopRequested) {
        resolve();
        return;
      }

      try {
        const startTime = ctx.currentTime;
        const ringDuration = 3.0; // Exact 3 seconds ring

        // Dynamics Compressor to maximize perceived volume without speaker clipping
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, startTime);
        compressor.knee.setValueAtTime(24, startTime);
        compressor.ratio.setValueAtTime(12, startTime);
        compressor.attack.setValueAtTime(0.003, startTime);
        compressor.release.setValueAtTime(0.2, startTime);
        compressor.connect(ctx.destination);

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.connect(compressor);

        // Dual resonant frequencies (standard attention-grabbing bell frequencies)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(853, startTime);
        osc2.frequency.setValueAtTime(960, startTime);

        // Bandpass filter to sculpt piercing bell resonance
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, startTime);
        filter.Q.setValueAtTime(2.2, startTime);

        osc1.connect(filter);
        osc2.connect(filter);

        // Tremolo: 16 Hz modulation for realistic mechanical ringer trill
        const tremoloGain = ctx.createGain();
        const lfo = ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(16, startTime);

        const lfoDepth = ctx.createGain();
        lfoDepth.gain.setValueAtTime(0.4, startTime);

        lfo.connect(lfoDepth);
        lfoDepth.connect(tremoloGain.gain);
        tremoloGain.gain.setValueAtTime(0.6, startTime);

        filter.connect(tremoloGain);
        tremoloGain.connect(masterGain);

        // Triple-burst rhythmic ring profile inside the 3 seconds:
        // Burst 1: 0.0s -> 0.85s (Ring)
        // Pause 1: 0.85s -> 0.95s
        // Burst 2: 0.95s -> 1.80s (Ring)
        // Pause 2: 1.80s -> 1.90s
        // Burst 3: 1.90s -> 2.85s (Ring)
        // Decay:   2.85s -> 3.00s (Fade)
        const bursts = [
          { start: 0.0, end: 0.85 },
          { start: 0.95, end: 1.80 },
          { start: 1.90, end: 2.85 }
        ];

        masterGain.gain.setValueAtTime(0, startTime);
        bursts.forEach(({ start, end }) => {
          masterGain.gain.setValueAtTime(0, startTime + start);
          masterGain.gain.linearRampToValueAtTime(0.95, startTime + start + 0.02);
          masterGain.gain.setValueAtTime(0.95, startTime + end - 0.03);
          masterGain.gain.linearRampToValueAtTime(0, startTime + end);
        });

        // Extra final decay to ensure clean release
        masterGain.gain.setValueAtTime(0, startTime + 2.85);
        masterGain.gain.linearRampToValueAtTime(0.8, startTime + 2.86);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + ringDuration);

        // Start all oscillators
        lfo.start(startTime);
        osc1.start(startTime);
        osc2.start(startTime);

        lfo.stop(startTime + ringDuration);
        osc1.stop(startTime + ringDuration);
        osc2.stop(startTime + ringDuration);

        // Store active nodes so stopKOTRinging can instantly silence if required
        const nodes = [osc1, osc2, lfo, masterGain];
        this.activeNodes.push(...nodes);

        // Vibrate mobile/tablet hardware if supported
        if (navigator.vibrate) {
          navigator.vibrate([350, 100, 350, 100, 350]);
        }

        setTimeout(() => {
          this.activeNodes = this.activeNodes.filter((n) => !nodes.includes(n));
          resolve();
        }, ringDuration * 1000);
      } catch (err) {
        console.error('Error in playSingle3SecRing:', err);
        resolve();
      }
    });
  }

  /**
   * Trigger loud ringing sound for N orders.
   * If 1 order -> rings 1 time for 3 sec.
   * If 2 orders simultaneously -> rings 2 times, 3 sec each with brief pause in-between.
   * If N orders -> rings N times for 3 sec each.
   */
  async ringForOrders(count = 1) {
    const ordersCount = Math.max(1, parseInt(count, 10) || 1);
    this.pendingRings += ordersCount;
    this.stopRequested = false;

    if (this.isRinging) {
      this.notifyListeners(true, this.pendingRings);
      return;
    }

    this.isRinging = true;
    this.notifyListeners(true, this.pendingRings);

    try {
      const ctx = await this.resumeContext();
      if (!ctx) {
        this.isRinging = false;
        this.pendingRings = 0;
        this.notifyListeners(false, 0);
        return;
      }

      while (this.pendingRings > 0 && !this.stopRequested) {
        this.notifyListeners(true, this.pendingRings);
        await this.playSingle3SecRing(ctx);
        this.pendingRings = Math.max(0, this.pendingRings - 1);

        if (this.pendingRings > 0 && !this.stopRequested) {
          // 0.4s pause between distinct 3-second rings
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.warn('Ringing execution error:', err);
    } finally {
      this.isRinging = false;
      this.pendingRings = 0;
      this.stopRequested = false;
      this.notifyListeners(false, 0);
    }
  }

  /**
   * Instantly silence active ringing
   */
  stop() {
    this.stopRequested = true;
    this.pendingRings = 0;
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (node.gain && typeof node.gain.setValueAtTime === 'function') {
          node.gain.setValueAtTime(0, 0);
        }
      } catch (e) {}
    });
    this.activeNodes = [];
    this.isRinging = false;
    this.notifyListeners(false, 0);
  }
}

export const kotAudio = new KOTAudioController();

export const ringKOTOrders = (count = 1) => kotAudio.ringForOrders(count);

export const stopKOTRinging = () => kotAudio.stop();

export const unlockKOTAudio = () => kotAudio.resumeContext();
