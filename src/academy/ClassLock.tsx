// "Sinf qulfi": keeps children inside the club. Full screen, external links blocked, back button and
// tab closing guarded, exit with the teacher PIN. The lock also ends by itself after the chosen time,
// so a forgotten PIN never leaves a computer stuck. For a lock the browser cannot escape at all, open
// the site in Chrome kiosk mode or Windows "Assigned access" (see README).
import { useEffect, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';

const pinKey = 'shaharcha-lock-pin';
const stateKey = 'shaharcha-lock-until';
const read = (key: string) => { try { return localStorage.getItem(key) ?? ''; } catch { return ''; } };
const write = (key: string, value: string | null) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* optional */ } };

export const lockDurations = [[45, '45 daqiqa (1 dars)'], [90, '90 daqiqa (juft dars)'], [180, '3 soat'], [480, 'Kun oxirigacha (8 soat)']] as const;

export function isExternal(href: string, origin = location.origin) {
  try { const url = new URL(href, origin); return url.origin !== origin; } catch { return false; }
}

/** Milliseconds until the lock ends, or 0 when the computer is not locked. */
export function lockRemaining(now = Date.now(), stored = read(stateKey)) {
  const until = Number(stored);
  return Number.isFinite(until) && until > now ? until - now : 0;
}

export function useClassLock() {
  const [locked, setLocked] = useState(() => lockRemaining() > 0);
  useEffect(() => {
    try { localStorage.removeItem('shaharcha-lock-on'); } catch { /* old version without a time limit */ }
  }, []);
  useEffect(() => {
    if (!locked) return;
    const clicks = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest?.('a');
      if (link && (isExternal(link.href) || link.target === '_blank')) { e.preventDefault(); e.stopPropagation(); }
    };
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const back = () => history.pushState(null, '', location.href);
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['w', 'n', 't', 'l'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'Home')) e.preventDefault();
    };
    const menu = (e: MouseEvent) => e.preventDefault();
    const refocus = (e: PointerEvent) => {
      // Do not grab full screen while the teacher is using the lock dialog.
      if ((e.target as HTMLElement).closest?.('.lock-dialog, .lock-button')) return;
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    };
    const expiry = window.setInterval(() => { if (!lockRemaining()) { write(stateKey, null); setLocked(false); } }, 15000);
    history.pushState(null, '', location.href);
    document.addEventListener('click', clicks, true);
    document.addEventListener('contextmenu', menu);
    window.addEventListener('beforeunload', unload);
    window.addEventListener('popstate', back);
    window.addEventListener('keydown', keys, true);
    document.addEventListener('pointerdown', refocus);
    const open = window.open;
    window.open = () => null;
    return () => {
      window.clearInterval(expiry);
      document.removeEventListener('click', clicks, true);
      document.removeEventListener('contextmenu', menu);
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('popstate', back);
      window.removeEventListener('keydown', keys, true);
      document.removeEventListener('pointerdown', refocus);
      window.open = open;
    };
  }, [locked]);
  return {
    locked,
    remaining: () => lockRemaining(),
    lock(pin: string, minutes: number) {
      write(pinKey, pin); write(stateKey, String(Date.now() + minutes * 60_000)); setLocked(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    },
    unlock(pin: string) {
      if (pin !== read(pinKey)) return false;
      write(stateKey, null); setLocked(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return true;
    },
  };
}

const clock = (ms: number) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60} daq` : `${m} daq`; };

export function ClassLockButton({ lock }: { lock: ReturnType<typeof useClassLock> }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [minutes, setMinutes] = useState(90);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const show = () => { setOpen(true); setPin(''); setAgain(''); setError(''); setHelp(false); };
  return <>
    <button className={`board-button lock-button ${lock.locked ? 'is-locked' : ''}`} onClick={show}
      aria-label={lock.locked ? 'Sinf qulfini ochish (o‘qituvchi PIN kodi bilan)' : 'Sinf qulfini yoqish'}>
      {lock.locked ? <><LockOpen size={17} /> <span className="lock-long">Qulfni ochish</span><span className="lock-short">Ochish</span></> : <><Lock size={17} /> <span>Sinf qulfi</span></>}</button>
    {open && <div className="lock-dialog" role="dialog" aria-modal="true" aria-label="Sinf qulfi"><form className="practice-card" onSubmit={e => {
      e.preventDefault();
      if (!/^\d{4,8}$/.test(pin)) { setError('PIN 4–8 ta raqamdan iborat bo‘lsin.'); return; }
      if (lock.locked) {
        if (lock.unlock(pin)) setOpen(false); else { setError('PIN noto‘g‘ri. Qayta kiriting.'); setPin(''); }
        return;
      }
      if (pin !== again) { setError('Ikkala PIN bir xil emas.'); setAgain(''); return; }
      lock.lock(pin, minutes); setOpen(false);
    }}>
      <h2>{lock.locked ? 'Qulfni ochish' : 'Sinf qulfini yoqish'}</h2>
      {lock.locked ? <p>O‘qituvchi PIN kodini kiriting. Qulf {clock(lock.remaining())} dan keyin o‘zi ochiladi.</p> :
        <p>Sayt to‘liq ekranga o‘tadi, boshqa saytlarga o‘tish, “orqaga” tugmasi va tabni yopish bloklanadi. Ochish — shu tugma va PIN orqali.</p>}
      <label>PIN kod<input className="mock-input" inputMode="numeric" autoComplete="off" type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={8} autoFocus /></label>
      {!lock.locked && <>
        <label>PIN kodni takrorlang<input className="mock-input" inputMode="numeric" autoComplete="off" type="password" value={again} onChange={e => setAgain(e.target.value.replace(/\D/g, ''))} maxLength={8} /></label>
        <label className="inline-select">Qancha vaqtga <select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{lockDurations.map(([m, text]) => <option key={m} value={m}>{text}</option>)}</select></label>
      </>}
      <p role="status" className="lock-error">{error}</p>
      <div className="result-actions"><button className="primary-button">{lock.locked ? 'Qulfni ochish' : 'Qulflash'}</button><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Bekor qilish</button></div>
      {lock.locked && <><button type="button" className="text-link" onClick={() => setHelp(!help)}>PIN esdan chiqdimi?</button>
        {help && <p className="grading-note">Qulf {clock(lock.remaining())} dan keyin o‘zi ochiladi. Hoziroq ochish kerak bo‘lsa: brauzer manzil satri yonidagi qulf belgisi → “Sayt sozlamalari” → “Ma’lumotlarni o‘chirish” (Chrome) — shu sayt ma’lumotlari tozalanadi va qulf olib tashlanadi.</p>}</>}
    </form></div>}
  </>;
}
