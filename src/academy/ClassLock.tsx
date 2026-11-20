// "Sinf qulfi": keeps children inside the club. Full screen, external links blocked, back button and
// tab closing guarded, exit only with the teacher PIN. For a lock the browser cannot escape at all, open
// the site in Chrome kiosk mode or Windows "Assigned access" (see README).
import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

const pinKey = 'shaharcha-lock-pin';
const stateKey = 'shaharcha-lock-on';
const read = (key: string) => { try { return localStorage.getItem(key) ?? ''; } catch { return ''; } };
const write = (key: string, value: string | null) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* optional */ } };

export function isExternal(href: string, origin = location.origin) {
  try { const url = new URL(href, origin); return url.origin !== origin; } catch { return false; }
}

export function useClassLock() {
  const [locked, setLocked] = useState(() => read(stateKey) === '1');
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
    const refocus = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); };
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
    lock(pin: string) { write(pinKey, pin); write(stateKey, '1'); setLocked(true); document.documentElement.requestFullscreen?.().catch(() => {}); },
    unlock(pin: string) {
      if (pin !== read(pinKey)) return false;
      write(stateKey, null); setLocked(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return true;
    },
  };
}

export function ClassLockButton({ lock }: { lock: ReturnType<typeof useClassLock> }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  return <>
    <button className="board-button" aria-pressed={lock.locked} onClick={() => { setOpen(true); setPin(''); setError(''); }}>
      {lock.locked ? <Lock size={17} /> : <Unlock size={17} />} <span>{lock.locked ? 'Qulflangan' : 'Sinf qulfi'}</span></button>
    {open && <div className="lock-dialog" role="dialog" aria-modal="true" aria-label="Sinf qulfi"><form className="practice-card" onSubmit={e => {
      e.preventDefault();
      if (!/^\d{4,8}$/.test(pin)) { setError('PIN 4–8 ta raqam bo‘lsin.'); return; }
      if (lock.locked) { if (lock.unlock(pin)) setOpen(false); else setError('PIN noto‘g‘ri.'); }
      else { lock.lock(pin); setOpen(false); }
    }}>
      <h2>{lock.locked ? 'Qulfni ochish (o‘qituvchi)' : 'Sinf qulfini yoqish'}</h2>
      <p>{lock.locked ? 'O‘qituvchi PIN kodini kiriting.' : 'Sayt to‘liq ekranga o‘tadi, tashqi havolalar, “orqaga” tugmasi va tabni yopish bloklanadi. Chiqish faqat shu PIN bilan.'}</p>
      <input className="mock-input" inputMode="numeric" autoComplete="off" type="password" value={pin} onChange={e => setPin(e.target.value)} aria-label="PIN" autoFocus />
      <p role="status">{error}</p>
      <div className="result-actions"><button className="primary-button">{lock.locked ? 'Ochish' : 'Qulflash'}</button><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Bekor qilish</button></div>
    </form></div>}
  </>;
}
