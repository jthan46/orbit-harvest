// Orbit Harvest — tiny WebAudio bleeps, synthesized live (no audio
// files). Sound is always optional: any failure is swallowed.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) { /* sound is optional */ }
  }

  return {
    beep,
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
  };
}
