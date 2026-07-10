function buildNotificationWavDataUri(): string {
  const sampleRate = 44100;
  const durationSeconds = 0.85;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Campana estilo iPhone: parciales inarmónicos + decay largo.
  const partials = [
    { frequency: 988, gain: 1, decay: 1.4 },
    { frequency: 1485, gain: 0.42, decay: 1.05 },
    { frequency: 1976, gain: 0.24, decay: 0.75 },
    { frequency: 2349, gain: 0.14, decay: 0.55 },
  ];

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    let sample = 0;
    for (const partial of partials) {
      const envelope = Math.exp(-t / partial.decay) * (1 - Math.exp(-t / 0.004));
      sample += Math.sin(2 * Math.PI * partial.frequency * t) * partial.gain * envelope;
    }
    const intSample = Math.max(-1, Math.min(1, sample * 0.42));
    view.setInt16(44 + i * 2, intSample * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const NOTIFICATION_SOUND_URI =
  typeof window !== "undefined" ? buildNotificationWavDataUri() : "";

let audioTemplate: HTMLAudioElement | null = null;
let audioReady = false;
let audioUnlockPromise: Promise<void> | null = null;

function createAudioTemplate(): HTMLAudioElement | null {
  if (typeof window === "undefined" || !NOTIFICATION_SOUND_URI) return null;
  const audio = new Audio(NOTIFICATION_SOUND_URI);
  audio.preload = "auto";
  audio.volume = 0.85;
  return audio;
}

/** Desbloquea audio del navegador (requiere gesto del usuario al menos una vez). */
export function unlockNotificationSound(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (audioReady) return Promise.resolve();
  if (audioUnlockPromise) return audioUnlockPromise;

  audioTemplate ??= createAudioTemplate();
  if (!audioTemplate) return Promise.resolve();

  const playResult = audioTemplate.play();
  audioUnlockPromise = Promise.resolve(playResult)
    .then(() => {
      audioTemplate?.pause();
      if (audioTemplate) audioTemplate.currentTime = 0;
      audioReady = true;
    })
    .catch(() => {
      // El navegador aún no permite audio; se reintentará al reproducir.
    })
    .finally(() => {
      audioUnlockPromise = null;
    });

  return audioUnlockPromise;
}

function playBellWithWebAudio(ctx: AudioContext): void {
  const start = ctx.currentTime;
  const partials = [
    { frequency: 988, gain: 1, decay: 1.4 },
    { frequency: 1485, gain: 0.42, decay: 1.05 },
    { frequency: 1976, gain: 0.24, decay: 0.75 },
    { frequency: 2349, gain: 0.14, decay: 0.55 },
  ];

  for (const partial of partials) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = partial.frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.38 * partial.gain, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + partial.decay);
    oscillator.start(start);
    oscillator.stop(start + partial.decay + 0.05);
  }
}

export async function playNotificationSound(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (!audioReady) {
      await unlockNotificationSound();
    }

    audioTemplate ??= createAudioTemplate();
    if (!audioTemplate) return;

    const clip = audioTemplate.cloneNode(true) as HTMLAudioElement;
    clip.volume = 0.85;
    await clip.play();
    return;
  } catch {
    // Fallback Web Audio API
  }

  try {
    const AudioCtx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    playBellWithWebAudio(ctx);
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Audio bloqueado o no soportado.
  }
}

export function setupNotificationSoundUnlock(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const unlock = () => {
    void unlockNotificationSound();
  };

  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
  window.addEventListener("touchstart", unlock, { capture: true, passive: true });

  return () => {
    window.removeEventListener("pointerdown", unlock, { capture: true });
    window.removeEventListener("keydown", unlock, { capture: true });
    window.removeEventListener("touchstart", unlock, { capture: true });
  };
}
