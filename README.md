# IT Shaharcha · English Club

Ingliz tili klubi uchun sayt: A1 dan C1 gacha grammatika kursi, 75+ interaktiv o‘yin, IELTS markazi (3D examiner bilan to‘liq Speaking imtihoni, Writing Task 1/2 band bahosi) va har sahifada ochiladigan 3D AI ustoz (o‘zbekcha va inglizcha).

## Ishga tushirish

```bash
npm ci
npm run dev      # http://localhost:3000
npm test
npm run build
```

## Headway grammatika yo‘li

**Grammatika** bo‘limi Headway (5-nashr) kitoblaridagi grammatika ketma-ketligida: Beginner → Elementary → Pre-Intermediate → Intermediate → Upper-Intermediate → Advanced, jami 85 ta dars (`src/academy/grammar/headway.ts`). Har bir dars: o‘zbekcha qoida, tuzilma, **Eshit va takrorla** (ustoz o‘qiydi, o‘quvchi takrorlaydi, to‘g‘ri aytilgan so‘zlar belgilanadi), 5 ta mashq, AI bilan cheksiz qo‘shimcha mashqlar va grammatika o‘yinlari. Tushuntirish va mashqlar klubniki — kitob matni ko‘chirilmagan; “Unit” raqami faqat mundarija tekshirilgan joylarda ko‘rsatiladi. Headway — Oxford University Press nashri, sayt nashriyot bilan bog‘liq emas.

## AI va ovoz kalitlari

`.env.example` dan nusxa olib `.env.local` yarating (yoki Vercel’da Environment Variables). Kalitlar faqat serverda turadi: brauzer `/api/tutor` va `/api/transcribe` ga murojaat qiladi.

| O‘zgaruvchi | Vazifasi |
| --- | --- |
| `OPENAI_API_KEY` | AI ustoz, Speaking/Writing band baholash, Part 3 examiner savollari, cheksiz grammatika mashqlari, internetdan yangi IELTS savollari, nutqni matnga aylantirish |
| `OPENAI_MODEL` | Ixtiyoriy. Bo‘sh bo‘lsa `gpt-5.4-mini → gpt-5-mini → gpt-4o-mini` ketma-ket sinaladi |
| `OPENAI_TRANSCRIBE_MODEL` | Ixtiyoriy. Standart `gpt-4o-mini-transcribe`, keyin `whisper-1` |
| `ELEVENLABS_API_KEY` | Examiner va ustoz ovozi |
| `ELEVENLABS_VOICE_ID_EN` / `_UZ` | Inglizcha va o‘zbekcha ovoz ID. Standart: ElevenLabs premade ovozlari |
| `ELEVENLABS_MODEL_EN` / `_UZ` | Standart `eleven_multilingual_v2` va `eleven_v3` |
| `CLUB_ACCESS_CODE` | Ixtiyoriy: begonalar API balansingizni ishlatmasligi uchun kod |
| `TUTOR_RATE_LIMIT` | Bir IP uchun daqiqasiga so‘rovlar (standart 90; butun sinf bitta IP’da bo‘ladi) |

**Tekshirish:** deploydan keyin `/api/tutor?check=1` ni oching. U kalitlarni ko‘rsatmaydi, faqat qaysi OpenAI modeli ishlashini, ElevenLabs ovozlari topilganini va qaysi ElevenLabs modellari o‘zbek tilini qo‘llashini ko‘rsatadi (`uzbekModels`). Agar `uzbekSupported: false` bo‘lsa, `ELEVENLABS_MODEL_UZ` ni ro‘yxatdagi modelga o‘zgartiring.

Kalitsiz ham sayt to‘liq ishlaydi: brauzer ovozi, oflayn grammatika ustozi va taxminiy Speaking bahosi bilan.

## IELTS savollari haqida

IELTS jonli imtihon savollarini rasman e’lon qilmaydi. Savollar banki 2025–2026 yillarda imtihonda tushgani haqida nomzodlar xabar bergan mavzular asosida, imtihon uslubida yozilgan. “Yangi tushgan savollar” tugmasi OpenAI web search orqali so‘nggi 12 oyda nomzodlar xabar bergan savollarni topib, sayt ichida ko‘rsatadi (kuniga bir marta keshlanadi).

## Sinf qulfi

Yuqoridagi **Sinf qulfi** tugmasi saytni to‘liq ekranga o‘tkazadi, tashqi havolalar, “orqaga” tugmasi va tabni yopishni bloklaydi; chiqish faqat o‘qituvchi PIN kodi bilan. Brauzer imkoniyatlari cheklangan, shuning uchun to‘liq qulf uchun kompyuterlarda kiosk rejimidan foydalaning:

```bash
chrome --kiosk --app=https://sizning-saytingiz.uz
```

Windows’da: Settings → Accounts → Other users → *Set up a kiosk (Assigned access)*.

## 3D ustoz va 3D studiya

- **Ustoz:** VRM avatar (pixiv VRoid namunasi). Tanasi [AI4AnimationPy](https://github.com/facebookresearch/ai4animationpy) dagi haqiqiy motion-capture yozuvi (Cranberry, `standing_S01`) bilan harakatlanadi: kutish, tushuntirish va tinglash holatlari VRM skeletiga ko‘chirilgan (`src/academy/three/coach.ts`). Ustiga: ko‘z qisish, ovozga mos lab harakati, sichqonchani kuzatuvchi ko‘zlar va bosh, soch fizikasi, qo‘l silkitish va doskaga ishora.
- **Bosh sahifa:** to‘q studiya, girih naqshli pol, yorug‘lik devori, ustoz projektor nurida, bo‘limlar shisha panellarda. Panelni bossangiz kamera unga uchib boradi.
- **3D sinf:** ustoz gologramma doska yonida, javob doskaga yoziladi.
- Fayllar: `public/teacher/teacher.vrm` (4.7 MB) va `public/teacher/motions.*` (270 KB), bir kun keshlanadi. Kuchsiz kompyuterlarda effektlar avtomatik kamayadi.

## Litsenziyalar

- Ustoz modeli: “VRM1_Constraint_Twist_Sample”, © 2022 pixiv Inc., VRM Public License 1.0.
- Harakatlar: AI4AnimationPy (Meta), CC BY-NC 4.0 — faqat notijorat foydalanish. Batafsil: `public/mentor/CREDITS.txt`.
