// Floating 3D teacher available on every page. Speaks and understands Uzbek and English.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GraduationCap, Mic, Send, Square, Volume2, VolumeX, X } from 'lucide-react';
import { ask, explain, getCapabilities, speak, stopSpeaking, transcribe } from './ai';
import type { Capabilities, Lang } from './ai';
import { AnswerRecorder, recordingSupported } from './ielts/recorder';
import { cefrLevels, grammar } from './grammar/curriculum';

const Mentor = lazy(() => import('./Mentor'));
type Message = { role: 'user' | 'assistant'; content: string };

export function askTeacher(question: string) {
  window.dispatchEvent(new CustomEvent('ustoz:ask', { detail: question }));
}

// Without the AI service the teacher still answers grammar questions from the built-in course.
export function offlineAnswer(question: string) {
  const q = question.toLowerCase();
  const topics = cefrLevels.flatMap(level => grammar[level].map(t => ({ level, t })));
  const scored = topics.map(({ level, t }) => {
    const words = (t.title + ' ' + t.uz).toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length > 2);
    return { level, t, score: words.filter(w => q.includes(w)).length };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return 'Hozir AI ulanmagan, lekin men grammatika kursidagi mavzularni tushuntira olaman. Masalan: “Present Perfect”, “Passive voice”, “Conditionals”, “articles” deb yozing.';
  return `${best.t.title} (${best.level}) — ${best.t.rule}\n\nMisollar:\n${best.t.examples.map(e => '• ' + e).join('\n')}`;
}

export function AiTeacher({ level }: { level: string }) {
  const [open, setOpen] = useState(false);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [lang, setLang] = useState<Lang>('uz');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Salom! Men Shaharcha ustoziman. Grammatika, so‘zlar yoki IELTS bo‘yicha istalgan savolingizni o‘zbekcha yoki inglizcha bering — yozing yoki mikrofonni bosib gapiring.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [pose, setPose] = useState('idle');
  const recorder = useRef<AnswerRecorder | null>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { getCapabilities().then(setCaps); }, []);
  useEffect(() => {
    const handler = (e: Event) => { setOpen(true); send((e as CustomEvent<string>).detail); };
    window.addEventListener('ustoz:ask', handler);
    return () => window.removeEventListener('ustoz:ask', handler);
  });
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => { if (!open) { stopSpeaking(); recorder.current?.release(); setRecording(false); } }, [open]);

  async function voice(text: string) {
    if (!autoVoice) return;
    setPose('talking');
    await speak(text.replace(/[*#_`]/g, ''), lang, { voice: caps?.voice }).done;
    setPose('idle');
  }

  async function send(text = input) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next); setInput(''); setBusy(true); setPose('listening');
    let reply: string;
    if (caps?.chat) {
      try { reply = (await ask<{ reply: string }>({ action: 'chat', language: lang, level, messages: next.slice(1).slice(-12) })).reply; }
      catch (error) { reply = explain(error) + '\n\n' + offlineAnswer(content); }
    } else reply = offlineAnswer(content);
    setMessages(m => [...m, { role: 'assistant', content: reply }]);
    setBusy(false); setPose('idle');
    voice(reply);
  }

  async function toggleMic() {
    if (recording) {
      const rec = recorder.current!;
      recorder.current = null; setRecording(false);
      const result = await rec.stop();
      if (!caps?.transcribe) return;
      setBusy(true);
      try {
        const { text } = await transcribe(result.blob, lang);
        setBusy(false);
        if (text) send(text);
      } catch (error) { setBusy(false); setMessages(m => [...m, { role: 'assistant', content: explain(error) }]); }
      return;
    }
    stopSpeaking();
    const rec = new AnswerRecorder();
    try { await rec.start(); recorder.current = rec; setRecording(true); setPose('listening'); }
    catch { setMessages(m => [...m, { role: 'assistant', content: 'Mikrofonga ruxsat berilmadi. Savolni yozib yuboring.' }]); }
  }

  return <>
    <button className={`ustoz-fab ${open ? 'hidden' : ''}`} onClick={() => setOpen(true)} aria-label="3D ustozni ochish"><GraduationCap size={24} /><span>Ustoz</span></button>
    {open && <aside className="ustoz-panel" aria-label="3D ustoz">
      <header><div className="ustoz-avatar"><Suspense fallback={null}><Mentor pose={pose} /></Suspense></div>
        <div><strong>Shaharcha Ustoz</strong><small>{caps?.chat ? 'AI ulangan · o‘zbekcha / English' : 'Oflayn rejim · grammatika kursi'}</small></div>
        <div className="ustoz-tools">
          <div className="lang-switch" role="group" aria-label="Til">{(['uz', 'en'] as const).map(l => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div>
          <button className="icon-button" aria-label={autoVoice ? 'Ovozni o‘chirish' : 'Ovozni yoqish'} onClick={() => { setAutoVoice(!autoVoice); stopSpeaking(); }}>{autoVoice ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="icon-button" aria-label="Yopish" onClick={() => setOpen(false)}><X size={18} /></button></div>
      </header>
      <div className="ustoz-messages" ref={list}>{messages.map((m, i) => <p key={i} className={m.role}>{m.content}</p>)}{busy && <p className="assistant typing">…</p>}</div>
      <form className="ustoz-input" onSubmit={e => { e.preventDefault(); send(); }}>
        {recordingSupported() && caps?.transcribe && <button type="button" className={`icon-button mic ${recording ? 'on' : ''}`} onClick={toggleMic} aria-label={recording ? 'Yozishni to‘xtatish' : 'Gapirish'}>{recording ? <Square size={17} /> : <Mic size={17} />}</button>}
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={recording ? 'Gapiring… tugatgach ■ ni bosing' : lang === 'uz' ? 'Savolingizni yozing…' : 'Ask me anything about English…'} maxLength={1200} />
        <button className="icon-button send" disabled={!input.trim() || busy} aria-label="Yuborish"><Send size={17} /></button>
      </form>
    </aside>}
  </>;
}
