// Records one spoken answer and measures fluency evidence (speaking time and pauses) in the browser.
export type Recording = { blob: Blob; seconds: number; pauses: number; longestPause: number; speakingSeconds: number };

export function recordingSupported() {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export function pauseStats(frames: boolean[], frameSeconds: number, minPause = 1) {
  // Ignore silence before the first and after the last spoken frame.
  const first = frames.indexOf(true), last = frames.lastIndexOf(true);
  let pauses = 0, longest = 0, run = 0, speaking = 0;
  if (first < 0) return { pauses: 0, longestPause: 0, speakingSeconds: 0 };
  for (let i = first; i <= last; i++) {
    if (frames[i]) {
      speaking++;
      if (run * frameSeconds >= minPause) pauses++;
      longest = Math.max(longest, run * frameSeconds);
      run = 0;
    } else run++;
  }
  return { pauses, longestPause: Math.round(longest * 10) / 10, speakingSeconds: Math.round(speaking * frameSeconds) };
}

export class AnswerRecorder {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private context?: AudioContext;
  private analyser?: AnalyserNode;
  private chunks: Blob[] = [];
  private frames: boolean[] = [];
  private timer = 0;
  private started = 0;
  private buffer = new Uint8Array(1024);
  level = 0;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported?.(t));
    this.recorder = new MediaRecorder(this.stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    this.chunks = [];
    this.frames = [];
    this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.timer = window.setInterval(() => {
      this.analyser!.getByteTimeDomainData(this.buffer);
      let sum = 0;
      for (const v of this.buffer) sum += (v - 128) ** 2;
      this.level = Math.sqrt(sum / this.buffer.length) / 128;
      this.frames.push(this.level > 0.025);
    }, 100);
    this.recorder.start(1000);
    this.started = performance.now();
  }

  get elapsed() { return this.started ? (performance.now() - this.started) / 1000 : 0; }

  get hasSpeech() { return this.frames.filter(Boolean).length >= 5; }

  /** Seconds of continuous silence at the end — used to move on when the candidate has finished. */
  get trailingSilence() {
    let run = 0;
    for (let i = this.frames.length - 1; i >= 0 && !this.frames[i]; i--) run++;
    return this.frames.includes(true) ? run / 10 : 0;
  }

  async stop(): Promise<Recording> {
    const recorder = this.recorder!;
    const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    this.release();
    const seconds = Math.round(this.elapsed);
    this.started = 0;
    return { blob: new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' }), seconds, ...pauseStats(this.frames, 0.1) };
  }

  release() {
    window.clearInterval(this.timer);
    this.stream?.getTracks().forEach(t => t.stop());
    this.context?.close().catch(() => {});
    this.context = undefined;
    this.level = 0;
  }
}
