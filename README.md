# IT Shaharcha · English Club

Ingliz tili klubi uchun sayt: A1 dan C1 gacha grammatika kursi, 75+ interaktiv o‘yin, IELTS markazi (3D examiner bilan to‘liq Speaking imtihoni, Writing Task 1/2 band bahosi) va har sahifada ochiladigan 3D AI ustoz (o‘zbekcha va inglizcha).

## Ishga tushirish

```bash
npm ci
npm run dev      # http://localhost:3000
npm test
npm run build
```

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

## 3D dunyo va 3D ustoz

- **Bosh sahifa — 3D English City:** suzib yuruvchi orol, markazda ustoz, atrofida bosiladigan binolar (kitoblardan qurilgan grammatika minorasi, Registon uslubidagi IELTS peshtoqi, Speaking mikrofoni, harfli kublar o‘yinxonasi), uchib yuruvchi inglizcha so‘zlar, yulduzlar va yorug‘lik effekti. Binoni bossangiz, kamera unga uchib boradi va bo‘lim ochiladi.
- **Ustoz:** sichqoncha tomonga qaraydi, salom berib qo‘l silkitadi, gapirganda ovoz balandligiga qarab bosh irg‘aydi va qo‘l harakat qiladi, visori ovoz bilan birga yonadi.
- **3D sinf:** “3D ustoz bilan dars” tugmasi yoki ustoz oynasidagi ⤢ tugmasi. Ustoz gologramma doska yonida turadi, javob doskaga yozilib boradi va ustoz unga qo‘li bilan ishora qiladi. Proyektor yoki doskada ko‘rsatish uchun qulay.
- Kuchsiz kompyuterlarda sayt o‘zi effektlarni kamaytiradi, ko‘rinmay turgan 3D oynalar esa to‘xtatib qo‘yiladi.

## 3D ustoz

Geno modeli va harakatlari [AI4AnimationPy](https://github.com/facebookresearch/ai4animationpy) (Meta) loyihasidan, CC BY-NC 4.0 litsenziyasi — faqat notijorat foydalanish. Ustoz gapirganda bosh va qo‘l harakatlari ovoz balandligiga moslashadi.
