import { TutorFeedback } from './TutorFeedback';
import { ArrowLeft, ArrowUpRight, Check, Headphones, Mic, RotateCcw, Square, Timer } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Level } from './lessons';
import { analyseSpeaking, speakingPrompts } from './speaking';

type RecognitionWindow = Window & {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
};

const Mentor = lazy(() => import('./Mentor'));

const council = 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/speaking';

export function SpeakingStudio({ level, onExit, award }: {
  level: Level;
  onExit: () => void;
  award: (index: number, points: number) => void;
}) {
  const prompts = speakingPrompts[level];
  const [index, setIndex] = useState(0);
  const prompt = prompts[index];

  return (
    <section className="practice speaking-studio">
      <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Mashqlarga qaytish</button>
      <div className="practice-heading speaking-heading">
        <div className="practice-kicker"><Mic size={18} /> {level === 'ielts' ? 'IELTS Speaking' : prompt.section}</div>
        <h1>Speaking Studio</h1>
        <div className="round-header">
          <span>{index + 1} / {prompts.length} mavzu</span>
          <div className="round-control" aria-label="Speaking mavzulari">
            {prompts.map((item, position) => (
              <button key={item.topic} onClick={() => setIndex(position)} aria-current={position === index ? 'step' : undefined} aria-label={`${item.section}: ${item.topic}`}>{position + 1}</button>
            ))}
          </div>
        </div>
      </div>
      <SpeakingRound key={index} prompt={prompt} award={() => award(index, 10)} />
      <a className="speaking-source" href="/mentor/CREDITS.txt" target="_blank" rel="noreferrer">3D harakat manbasi va litsenziya</a>{' · '}
      {level === 'ielts' && <a className="speaking-source" href={council} target="_blank" rel="noreferrer">British Council rasmiy Speaking mashqlari <ArrowUpRight size={17} /></a>}
    </section>
  );
}

export function SpeakingRound({ prompt, award, onTranscriptReview }: {
  prompt: (typeof speakingPrompts)[Level][number];
  award: () => void;
  onTranscriptReview?: (text: string) => void;
}) {
  const win = window as RecognitionWindow;
  const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const recognition = useRef<SpeechRecognition | null>(null);
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const [transcript, setTranscript] = useState('');
  const [live, setLive] = useState('');
  const [coach, setCoach] = useState<'idle' | 'talking' | 'listening' | 'review'>('idle');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<ReturnType<typeof analyseSpeaking> | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [prepEnd, setPrepEnd] = useState<number | null>(null);
  const [prepLeft, setPrepLeft] = useState(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const listening = coach === 'listening';

  function stopSpeech() {
    if (!speech.current) return;
    speech.current.onend = null;
    speech.current.onerror = null;
    speech.current = null;
    window.speechSynthesis.cancel();
  }

  useEffect(() => () => {
    const active = recognition.current;
    if (active) {
      active.onresult = null;
      active.onend = null;
      active.onerror = null;
      recognition.current = null;
      active.abort();
    }
    stopSpeech();
  }, []);

  useEffect(() => {
    if (prepEnd === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((prepEnd - performance.now()) / 1000));
      setPrepLeft(left);
      if (left === 0) setPrepEnd(null);
    };
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [prepEnd]);

  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  function readQuestion() {
    if (!canSpeak || recognition.current) return;
    if (speech.current) {
      stopSpeech();
      setCoach('idle');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(prompt.question);
    utterance.lang = 'en-GB';
    utterance.rate = 0.91;
    utterance.onend = () => {
      speech.current = null;
      setCoach('idle');
    };
    utterance.onerror = () => {
      speech.current = null;
      setCoach('idle');
      setNotice('Brauzer savolni ovoz chiqarib o‘qiy olmadi.');
    };
    speech.current = utterance;
    setNotice('');
    setCoach('talking');
    window.speechSynthesis.speak(utterance);
  }

  function toggleMic() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    if (!Recognition) return;

    stopSpeech();
    setPrepEnd(null);
    setNotice('');
    setLive('');
    setResult(null);
    onTranscriptReview?.('');
    const session = new Recognition();
    session.lang = 'en-GB';
    session.continuous = true;
    session.interimResults = true;
    session.onresult = event => {
      const final: string[] = [];
      const interim: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        (item.isFinal ? final : interim).push(item[0].transcript.trim());
      }
      if (final.length) setTranscript(previous => [previous.trim(), ...final].filter(Boolean).join(' ').slice(0, 2400));
      setLive(interim.join(' '));
    };
    session.onerror = event => {
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setNotice('Mikrofonga ruxsat berilmadi. Brauzer sozlamasidan ruxsat bering yoki javobni yozing.');
      } else {
        setNotice('Brauzer javobni eshita olmadi. Qayta urinib ko‘ring yoki javobni yozing.');
      }
    };
    session.onend = () => {
      recognition.current = null;
      setLive('');
      setCoach('idle');
    };
    recognition.current = session;
    try {
      session.start();
      setCoach('listening');
    } catch {
      recognition.current = null;
      setCoach('idle');
      setNotice('Mikrofon ishga tushmadi. Javobni yozishingiz mumkin.');
    }
  }

  function review() {
    if (recognition.current || !transcript.trim()) return;
    stopSpeech();
    const feedback = analyseSpeaking(transcript);
    setResult(feedback);
    onTranscriptReview?.(transcript);
    setCoach('review');
    if (feedback.words >= prompt.goal) award();
  }

  return (
    <div className="practice-stack">
      <article className="practice-card speaking-prompt">
        <div className="coach-stage" data-pose={coach}>
          <Suspense fallback={<span>Ustoz yuklanmoqda…</span>}><Mentor pose={coach} /></Suspense>
          <strong>{({ idle: 'Gapirishga tayyormisiz?', talking: 'Murabbiy savol beryapti', listening: 'Murabbiy tinglayapti', review: 'Mashq tahlili tayyor' })[coach]}</strong>
        </div>
        <div className="speaking-question">
          <div className="question-label">{prompt.section} · <span lang="en">{prompt.topic}</span></div>
          <h2 lang="en">{prompt.question}</h2>
          <ul lang="en">{prompt.cues.map(cue => <li key={cue}>{cue}</li>)}</ul>
          <div className="reading-actions">
            {canSpeak && <button className="secondary-button" disabled={listening} onClick={readQuestion}><Headphones size={17} /> {coach === 'talking' ? 'Ovozni to‘xtatish' : 'Savolni tinglash'}</button>}
            {prompt.preparation && (
              <button className="secondary-button" disabled={listening} onClick={() => {
                if (prepEnd !== null) {
                  setPrepEnd(null);
                  setPrepLeft(0);
                } else {
                  setPrepLeft(prompt.preparation!);
                  setPrepEnd(performance.now() + prompt.preparation! * 1000);
                }
              }}><Timer size={17} /> {prepEnd === null ? '60 soniya tayyorlanish' : 'Taymerni to‘xtatish'}</button>
            )}
            {prepEnd !== null && <span className="prep-clock" aria-label="Tayyorgarlik vaqti">{prepLeft} s</span>}
          </div>
          {prompt.preparation && <p className="grading-note">Tayyorlangandan keyin 1–2 daqiqa gapirishga harakat qiling.</p>}
        </div>
      </article>

      <article className="practice-card speaking-answer">
        <h2>Javobingiz</h2>
        <p className="grading-note">{Recognition ? 'Mikrofonni yoqing. Brauzer ovozni matnga aylantirishi uchun nutq xizmatidan foydalanishi mumkin.' : 'Bu brauzerda ovozni matnga aylantirish mavjud emas. Javobingizni inglizcha yozing.'}</p>
        {Recognition && <button className="secondary-button mic-button" onClick={toggleMic}>{listening ? <><Square size={17} /> Mikrofonni to‘xtatish</> : <><Mic size={17} /> Gapirishni boshlash</>}</button>}
        <p className="speaking-status" role="status">{live || notice}</p>
        <label htmlFor="speaking-transcript">Brauzer tushungan matn yoki yozma javob</label>
        <textarea id="speaking-transcript" lang="en" value={transcript} readOnly={listening} maxLength={2400} rows={5} onChange={event => {
          setTranscript(event.target.value);
          onTranscriptReview?.('');
          setResult(null);
          setCoach('idle');
        }} />
        <p className="grading-note">Avval matnni tekshiring. Tavsiyalar matnga asoslanadi. Talaffuz va rasmiy IELTS bandi alohida baholashni talab qiladi.</p>
        <div className="result-actions">
          <button className="primary-button" onClick={review} disabled={listening || !transcript.trim()}><Check size={17} /> Javobni tahlil qilish</button>
          <button className="secondary-button" disabled={listening || !transcript} onClick={() => {
            setTranscript('');
            onTranscriptReview?.('');
            setResult(null);
            setCoach('idle');
            stopSpeech();
          }}><RotateCcw size={17} /> Matnni tozalash</button>
        </div>
      </article>

      {result && <section className="practice-card speaking-result">
        <h2 ref={resultHeading} tabIndex={-1}>Speaking tahlili</h2>
        <p>{result.words} ta so‘z · mashq maqsadi {prompt.goal} ta so‘z {result.words >= prompt.goal && '· 10 XP'}</p>
        {result.words < prompt.goal && <p>Javobni sabab va aniq misol bilan kengaytirib ko‘ring.</p>}
        {result.fillers > 0 && <p>{result.fillers} ta “um”, “uh” yoki “erm” topildi. O‘rniga qisqa pauza qilib ko‘ring.</p>}
        {result.errors.length > 0 ? <ul className="speaking-errors">{result.errors.map(error => (
          <li key={error.tip}><mark lang="en">{error.phrase}</mark> {error.tip}</li>
        ))}</ul> : <p>Tekshirilgan keng tarqalgan grammatik xatolar topilmadi.</p>}
        <button className="secondary-button" onClick={() => setShowModel(!showModel)} aria-expanded={showModel}>{showModel ? 'Namunani yashirish' : 'Namunaviy javob'}</button>
        {showModel && <p className="translation-box" lang="en">{prompt.model}</p>}
        <TutorFeedback skill="Speaking" prompt={prompt.question} answer={transcript} />
      </section>}
    </div>
  );
}
