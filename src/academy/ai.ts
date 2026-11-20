// Browser side of the AI teacher: talks only to our own /api endpoints.
export type Lang = 'uz' | 'en';
export type Capabilities = { feedback: boolean; chat: boolean; assess: boolean; transcribe: boolean; exercises: boolean; fresh: boolean; voice: boolean; locked: boolean };

const codeKey = 'shaharcha-club-code';
export const clubCode = {
  get: () => { try { return localStorage.getItem(codeKey) ?? ''; } catch { return ''; } },
  set: (value: string) => { try { localStorage.setItem(codeKey, value); } catch { /* optional */ } },
};

let capabilities: Promise<Capabilities> | null = null;
export function getCapabilities(): Promise<Capabilities> {
  capabilities ??= fetch('/api/tutor').then(r => r.ok ? r.json() : null).catch(() => null).then(data => ({
    feedback: false, chat: false, assess: false, transcribe: false, exercises: false, fresh: false, voice: false, locked: false, ...(data ?? {}),
  }));
  return capabilities;
}

export class AiError extends Error {
  constructor(public status: number) { super('ai ' + status); }
}

export function explain(error: unknown): string {
  const status = error instanceof AiError ? error.status : 0;
  if (status === 429) return 'Juda ko‘p so‘rov. Bir daqiqadan keyin qayta urinib ko‘ring.';
  if (status === 401) return 'Klub kodi noto‘g‘ri. O‘qituvchi panelida kodni kiriting.';
  if (status === 503) return 'AI xizmati hali sozlanmagan (server kalitlari yo‘q).';
  return 'AI xizmatiga ulanib bo‘lmadi. Qayta urinib ko‘ring.';
}

function headers(extra: Record<string, string> = {}) {
  const code = clubCode.get();
  return code ? { ...extra, 'x-club-code': code } : extra;
}

export async function ask<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/tutor', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(body), signal });
  if (!response.ok) throw new AiError(response.status);
  return response.json();
}

export async function transcribe(blob: Blob, lang: Lang, signal?: AbortSignal): Promise<{ text: string; unclear: string[] }> {
  const type = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
  const response = await fetch(`/api/transcribe?lang=${lang}&type=${type}`, { method: 'POST', headers: headers({ 'Content-Type': 'application/octet-stream' }), body: blob, signal });
  if (!response.ok) throw new AiError(response.status);
  return response.json();
}

// ---- Voice: ElevenLabs through the server, browser voice as a fallback. ----
type Speaking = { stop: () => void; done: Promise<void> };
let analyser: AnalyserNode | null = null;
let context: AudioContext | null = null;
let current: Speaking | null = null;
const levelBuffer = new Uint8Array(256);
let syntheticUntil = 0;

/** 0..1 loudness of the teacher's voice right now — drives the 3D mentor's head and gestures. */
export function voiceEnergy(): number {
  if (analyser) {
    analyser.getByteTimeDomainData(levelBuffer);
    let sum = 0;
    for (const v of levelBuffer) sum += (v - 128) ** 2;
    const rms = Math.sqrt(sum / levelBuffer.length) / 128;
    if (rms > 0.004) return Math.min(1, rms * 4.5);
  }
  if (performance.now() < syntheticUntil) return 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 95));
  return 0;
}

export function stopSpeaking() {
  current?.stop();
  current = null;
}

const voiceCache = new Map<string, string>();

export function speak(text: string, lang: Lang, options: { voice?: boolean; slow?: boolean } = {}): Speaking {
  stopSpeaking();
  let stopped = false;
  let stopInner = () => {};
  const done = (async () => {
    if (options.voice) {
      try {
        const key = lang + ':' + text;
        let url = voiceCache.get(key);
        if (!url) {
          const response = await fetch('/api/tutor', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ action: 'voice', language: lang, text: text.slice(0, 3000), slow: options.slow }) });
          if (!response.ok) throw new AiError(response.status);
          url = URL.createObjectURL(await response.blob());
          if (voiceCache.size > 40) { const [first, old] = voiceCache.entries().next().value!; URL.revokeObjectURL(old); voiceCache.delete(first); }
          voiceCache.set(key, url);
        }
        if (stopped) return;
        const audio = new Audio(url);
        try {
          context ??= new AudioContext();
          if (context.state === 'suspended') await context.resume();
          const source = context.createMediaElementSource(audio);
          analyser = context.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analyser.connect(context.destination);
        } catch { analyser = null; }
        await new Promise<void>((resolve, reject) => {
          stopInner = () => { audio.pause(); resolve(); };
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('audio'));
          audio.play().catch(reject);
        });
        analyser = null;
        return;
      } catch { analyser = null; if (stopped) return; }
    }
    await browserVoice(text, lang, options.slow, inner => { stopInner = inner; });
  })();
  const handle = { stop: () => { stopped = true; stopInner(); syntheticUntil = 0; window.speechSynthesis?.cancel(); }, done };
  current = handle;
  return handle;
}

function browserVoice(text: string, lang: Lang, slow: boolean | undefined, setStop: (stop: () => void) => void) {
  return new Promise<void>(resolve => {
    if (!('speechSynthesis' in window)) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const wanted = lang === 'en' ? ['en-GB', 'en'] : ['uz', 'tr', 'ru'];
    utterance.voice = wanted.map(code => voices.find(v => v.lang.toLowerCase().startsWith(code.toLowerCase()))).find(Boolean) ?? null;
    utterance.lang = lang === 'en' ? 'en-GB' : 'uz-UZ';
    utterance.rate = slow ? 0.85 : 0.95;
    const tick = window.setInterval(() => { syntheticUntil = performance.now() + 250; }, 120);
    const finish = () => { window.clearInterval(tick); syntheticUntil = 0; resolve(); };
    utterance.onend = finish;
    utterance.onerror = finish;
    setStop(() => { window.speechSynthesis.cancel(); finish(); });
    window.speechSynthesis.speak(utterance);
  });
}
