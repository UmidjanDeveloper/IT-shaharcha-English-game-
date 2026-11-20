import { useEffect, useRef, useState } from 'react';
import { Headphones, Sparkles } from 'lucide-react';

type Props = { prompt: string; answer: string; skill: 'Writing' | 'Speaking' };

export function TutorFeedback({ prompt, answer, skill }: Props) {
  const [available, setAvailable] = useState({ feedback: false, voice: false });
  const [lang, setLang] = useState<'uz'|'en'>('uz');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [audio, setAudio] = useState('');
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/tutor', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) setAvailable(data);
    }).catch(() => {});
    return () => { controller.abort(); active.current?.abort(); };
  }, []);
  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio); }, [audio]);

  useEffect(() => {
    active.current?.abort();
    setBusy(false); setMessage(''); setFeedback(''); setAudio('');
  }, [prompt, answer]);

  async function ask(action: 'feedback'|'voice') {
    if (busy) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setMessage(''); setAudio('');
    try {
      const body = action === 'feedback' ? { action, language: lang, prompt, answer, skill } :
        { action, language: feedback ? lang : 'en', text: feedback || prompt };
      const response = await fetch('/api/tutor', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:controller.signal });
      if (!response.ok) {
        setMessage(response.status === 429 ? 'Bir daqiqadan keyin qayta urinib ko‘ring.' : action === 'voice' ? 'Tanlangan ovoz yoki til bilan audio olinmadi. Matnni o‘qishingiz mumkin.' : 'Izoh olinmadi. Qayta urinib ko‘ring.');
        return;
      }
      if (action === 'feedback') setFeedback((await response.json()).feedback);
      else setAudio(URL.createObjectURL(await response.blob()));
    } catch { if (!controller.signal.aborted) setMessage('Xizmatga ulanib bo‘lmadi.'); }
    finally { if (active.current === controller && !controller.signal.aborted) setBusy(false); }
  }

  if (!available.feedback && !available.voice) return null;
  return <section className="tutor-panel">
    <h3><Sparkles size={18}/> AI ustoz</h3>
    {available.feedback && <><label>Izoh tili <select value={lang} disabled={busy} onChange={e=>{
      setLang(e.target.value as 'uz'|'en'); setFeedback(''); setAudio(''); setMessage('');
    }}><option value="uz">O‘zbekcha</option><option value="en">English</option></select></label>
    <p className="grading-note">Izoh so‘ralganda savol va yozilgan javob OpenAI’ga yuboriladi.</p></>}
    <div className="reading-actions">
      {available.feedback && <button className="secondary-button" disabled={busy || !answer.trim() || answer.length>5000} onClick={()=>ask('feedback')}>AI izohini olish</button>}
      {available.voice && <button className="secondary-button" disabled={busy} onClick={()=>ask('voice')}><Headphones size={17}/>{feedback ? 'Izohni tinglash' : 'Inglizcha topshiriqni tinglash'}</button>}
    </div>
    {feedback && <p className="translation-box" lang={lang}>{feedback}</p>}
    <div role="status">{busy ? 'Tayyorlanmoqda…' : message}</div>
    {audio && <audio controls autoPlay className="mock-audio" src={audio}/>}
  </section>;
}
