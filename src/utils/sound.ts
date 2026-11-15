let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playFeedbackSound(
  type: 'correct' | 'mistake' | 'attack' | 'victory',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playTone = (freq: number, startOffset: number, duration: number, gainPeak: number, wave: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now + startOffset);
    gain.gain.setValueAtTime(0.001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  if (type === 'correct') {
    playTone(523.25, 0, 0.14, 0.07, 'sine');
    playTone(659.25, 0.09, 0.22, 0.08, 'sine');
  } else if (type === 'mistake') {
    playTone(240, 0, 0.16, 0.06, 'triangle');
    playTone(196, 0.1, 0.2, 0.05, 'triangle');
  } else if (type === 'attack') {
    playTone(330, 0, 0.08, 0.08, 'triangle');
    playTone(587.33, 0.06, 0.16, 0.08, 'sine');
  } else if (type === 'victory') {
    playTone(523.25, 0, 0.14, 0.07, 'sine');
    playTone(659.25, 0.11, 0.14, 0.07, 'sine');
    playTone(783.99, 0.22, 0.16, 0.08, 'sine');
    playTone(1046.5, 0.34, 0.35, 0.09, 'sine');
  }
}
