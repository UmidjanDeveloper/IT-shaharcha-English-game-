import React, { useState } from 'react';
import { GameDifficulty, Team, GameType, GameMode, GameMetadata } from '../types';
import { sound } from '../utils/audio';
import { Gamepad2, Settings, ArrowRight, Sparkles, BookOpen, ChevronDown, ChevronUp, Mic } from 'lucide-react';

interface SetupScreenProps {
  teamLeft: Team;
  teamRight: Team;
  maxScore: number;
  useCustomVocabulary: boolean;
  onStartGame: (config: {
    selectedGame: GameType;
    selectedDifficulty: GameDifficulty;
    teamLeft: Team;
    teamRight: Team;
    maxScore: number;
  }) => void;
  onOpenTeacherSettings: () => void;
  onOpenShadowing: () => void;
}

const ALL_GAMES: GameMetadata[] = [
  // =========== SOLO GAMES (15) ===========
  {
    id: 'spelling-bee', title: "Spelling Bee 🐝", icon: '🐝', mode: 'solo',
    description: "O'zbekcha so'zni inglizcha harflab to'g'ri yozish.",
    howToPlay: [
      "Ekranda o'zbekcha so'z chiqadi",
      "Siz uni inglizcha harflab kiriting (klaviatura yoki tugmalar)",
      "To'g'ri yozsangiz — ball olinadi, xato bo'lsa — yangi urinish",
      "60 soniya ichida imkon qadar ko'proq so'z to'g'ri yozing"
    ]
  },
  {
    id: 'hangman', title: "Hangman 💀", icon: '💀', mode: 'solo',
    description: "Harflarni taxmin qilib yashirin so'zni topish.",
    howToPlay: [
      "Yashirin inglizcha so'z chiqadi — faqat tirrelar ko'rinadi",
      "Alfavitdan bittadan harf tanlang",
      "To'g'ri harf — so'zda ochiladi, noto'g'ri — odam rasmi chiziladi",
      "6 xatogacha ruxsat — so'zni to'liq oching va g'alaba qilasiz"
    ]
  },
  {
    id: 'anagram', title: "Anagram o'yini 🔮", icon: '🔮', mode: 'solo',
    description: "Aralashtirilgan harflardan so'z yasang.",
    howToPlay: [
      "Inglizcha so'zning harflari aralashtirilib ko'rsatiladi",
      "Harflarni to'g'ri tartibga solib so'z hosil qiling",
      "Tugmalarni bosib harflarni joylashtiring",
      "To'g'ri so'z topilsa ball — qancha tez, shuncha yuqori ball"
    ]
  },
  {
    id: 'word-search', title: "Word Search 🔍", icon: '🔍', mode: 'solo',
    description: "Harflar to'ridan inglizcha so'zlarni izlash.",
    howToPlay: [
      "Ekranda harflar to'ri ko'rsatiladi",
      "Chap tomonda topish kerak bo'lgan inglizcha so'zlar ro'yxati bor",
      "To'rdagi so'zlarni gorizontal, vertikal yoki diagonal toping",
      "Barcha so'zlarni topganingizda o'yin tugaydi"
    ]
  },
  {
    id: 'fill-blank', title: "Gap To'ldirish 📝", icon: '📝', mode: 'solo',
    description: "Inglizcha gapdagi bo'sh joyga mos so'zni qo'yish.",
    howToPlay: [
      "Inglizcha gap ko'rsatiladi — ichida bo'sh joy bor",
      "4 ta variant ichidan to'g'ri so'zni tanlang",
      "Grammatika va ma'noga e'tibor bering",
      "Har to'g'ri javob uchun ball olinadi"
    ]
  },
  {
    id: 'emoji-quiz', title: "Emoji Quiz 🎯", icon: '🎯', mode: 'solo',
    description: "Emoji ko'rinib turadi – uning inglizcha so'zini toping!",
    howToPlay: [
      "Ekranda emoji (rasm belgi) ko'rsatiladi",
      "Uning inglizcha nomini yozing yoki variantlardan tanlang",
      "Masalan: 🐈 → 'cat', 🌞 → 'sun'",
      "Tez va to'g'ri javob berganingiz uchun ko'proq ball"
    ]
  },
  {
    id: 'synonym-find', title: "Sinonim Topish 🔄", icon: '🔄', mode: 'solo',
    description: "Ko'rsatilgan so'zning inglizcha sinonimini toping.",
    howToPlay: [
      "Inglizcha so'z ko'rsatiladi",
      "4 ta variant ichidan uning sinonimini (o'xshash ma'noli so'z) tanlang",
      "Masalan: 'big' → 'large', 'happy' → 'joyful'",
      "Har to'g'ri javob uchun ball"
    ]
  },
  {
    id: 'definition-quiz', title: "Ta'rif Testi 📖", icon: '📖', mode: 'solo',
    description: "Inglizcha ta'rifdan so'zni aniqlang.",
    howToPlay: [
      "Inglizcha ta'rif (izoh) ko'rsatiladi",
      "4 variant ichidan qaysi so'z shu ta'rifga mos kelishini toping",
      "Masalan: 'A vehicle with two wheels' → 'bicycle'",
      "Imkon qadar tez va aniq javob bering"
    ]
  },
  {
    id: 'word-scramble', title: "So'z Aralashtirish 🌀", icon: '🌀', mode: 'solo',
    description: "Aralashtirilgan harflarni tartibga solib so'z hosil qiling.",
    howToPlay: [
      "O'zbekcha tarjimasi berilgan inglizcha so'z aralashtiriladi",
      "Harflarga bosib to'g'ri tartibda so'z yozing",
      "Maslahat: avval o'zbekcha ma'nosini o'qing, so'ng harflarga e'tibor bering",
      "Tez tugatganingiz uchun bonus ball"
    ]
  },
  {
    id: 'listening-quiz', title: "Eshitib Yozish 🎧", icon: '🎧', mode: 'solo',
    description: "So'z aytiladi – inglizcha yozing!",
    howToPlay: [
      "O'yin boshlanganda inglizcha so'z ovoz bilan aytiladi",
      "Eshitgan so'zingizni inglizcha klaviaturada yozing",
      "Yana eshitish uchun 🔊 tugmasini bosing",
      "To'g'ri yozsangiz ball, xato bo'lsa ovozni yana eshiting"
    ]
  },
  {
    id: 'vocab-speed', title: "Tezkor Lug'at ⚡", icon: '⚡', mode: 'solo',
    description: "60 soniya ichida imkon qadar ko'proq so'z tarjima qiling.",
    howToPlay: [
      "Taymer 60 soniyadan boshlanadi",
      "O'zbekcha so'z ko'rsatiladi — inglizcha tarjimasini 4 variantdan tanlang",
      "To'g'ri javob berganingizda darhol yangi so'z chiqadi",
      "60 soniyada eng ko'p to'g'ri javob — rekord!"
    ]
  },
  {
    id: 'letter-hint', title: "Harf Yashirish 🔐", icon: '🔐', mode: 'solo',
    description: "Faqat birinchi harf ko'rinadi – so'zni toping!",
    howToPlay: [
      "O'zbekcha so'z va inglizcha so'zning faqat birinchi harfi ko'rsatiladi",
      "Qolgan harflarni o'zingiz taxmin qilib to'liq so'zni yozing",
      "Masalan: 'katta' → 'l___' (large)",
      "To'g'ri topganingiz uchun ball — qancha kam urinish, shuncha ko'p"
    ]
  },
  {
    id: 'grammar-choose', title: "Grammatika Tanlash 📚", icon: '📚', mode: 'solo',
    description: "To'g'ri grammatik shaklni tanlang.",
    howToPlay: [
      "Inglizcha gap ko'rsatiladi — ichida grammatik xato yoki bo'sh joy bor",
      "4 variant ichidan grammatik jihatdan to'g'ri shaklni tanlang",
      "Masalan: 'She ___ (go/goes/gone) to school every day'",
      "Har to'g'ri javob uchun ball"
    ]
  },
  {
    id: 'word-builder', title: "So'z Quruvchi 🏗️", icon: '🏗️', mode: 'solo',
    description: "Berilgan syllablardan inglizcha so'z yasang.",
    howToPlay: [
      "Inglizcha so'zning bo'g'inlari (syllable) aralashtirib beriladi",
      "Bo'g'inlarni to'g'ri tartibda bosib so'z hosil qiling",
      "Masalan: 'BER' + 'MEM' → 'MEMBER'",
      "Barcha bo'g'inlarni to'g'ri joylashtirganingizda ball"
    ]
  },
  {
    id: 'flashcard-solo', title: "Flashcard Solo 🃏", icon: '🃏', mode: 'solo',
    description: "Kartochkalarni ag'darib so'z eslab qolish mashqi.",
    howToPlay: [
      "Kartochka ko'rsatiladi — old tomonda inglizcha so'z",
      "Kartochkani ag'daring — orqa tomonda o'zbekcha tarjima",
      "O'zingizdan so'rang: bu so'zni bilasizmi?",
      "'Bildim' yoki 'Bilmadim' tugmasini bosing — statistika hisoblanadi"
    ]
  },

  // =========== DUEL GAMES (17) ===========
  {
    id: 'word-duel', title: "Word Duel ⚔️ ⭐", icon: '⚔️', mode: 'duel',
    description: "Split-screen: uchar so'zlar orasidan tezkor topish.",
    howToPlay: [
      "Ekran ikki qismga bo'linadi — har bir o'yinchi o'z tomonida",
      "O'zbekcha so'z ko'rsatiladi — inglizcha tarjimasini 4 variantdan topish kerak",
      "Kim birinchi to'g'ri tugmani bossa — ball o'sha o'yinchiga",
      "Belgilangan ballga birinchi yetgan o'yinchi g'alaba qiladi"
    ]
  },
  {
    id: 'true-false', title: "True-False Clash ⚖️", icon: '⚖️', mode: 'duel',
    description: "Tezkor Rost yoki Yolg'on: kim birinchi to'g'ri topsa!",
    howToPlay: [
      "So'z va uning tarjimasi ko'rsatiladi — to'g'rimi yoki noto'g'rimi?",
      "Chap o'yinchi 'Rost', o'ng o'yinchi 'Yolg'on' tugmasini bosadi",
      "Kim tez va to'g'ri bosса — ball o'sha o'yinchiga",
      "Tez qaror qabul qilish muhim — ikkilanmang!"
    ]
  },
  {
    id: 'spelling-race', title: "Spelling Race 🏎️", icon: '🏎️', mode: 'duel',
    description: "Kim birinchi harflarni to'g'ri joylaydi.",
    howToPlay: [
      "Ikkala o'yinchiga bir xil so'z beriladi",
      "Har biri o'z ekranida harflarni bosib so'zni to'g'ri yozadi",
      "Kim birinchi to'g'ri yozib tugatsа — ball o'sha o'yinchiga",
      "Tezlik va aniqlik ikkalasi ham muhim!"
    ]
  },
  {
    id: 'sentence-duel', title: "Sentence Builder 🧱", icon: '🧱', mode: 'duel',
    description: "Gap so'zlarini to'g'ri tartibga solish musobaqasi.",
    howToPlay: [
      "Inglizcha gapning so'zlari aralashtiriladi",
      "Ikkala o'yinchi so'zlarni to'g'ri tartibda bosadi",
      "Kim birinchi to'g'ri gap tuzsa — ball o'sha o'yinchiga",
      "Grammatikaga e'tibor bering!"
    ]
  },
  {
    id: 'flashcard-battle', title: "Flashcard Battle ⚡", icon: '⚡', mode: 'duel',
    description: "Yopiq kartalar – eslab qoling va topishda raqobat.",
    howToPlay: [
      "Kartochkalar yopiq holda ko'rsatiladi",
      "Avval barchasini bir marta ko'rish mumkin — eslab qoling",
      "Keyin o'yinchi kartochkani ochib, uning juftini topadi",
      "Kim ko'proq juft topsa — g'alaba o'shada"
    ]
  },
  {
    id: 'speed-quiz', title: "Speed Quiz 🚀", icon: '🚀', mode: 'duel',
    description: "Eng tez to'g'ri javob berganni ball kutmoqda!",
    howToPlay: [
      "Savol ekran o'rtasida chiqadi — ikki o'yinchi ko'radi",
      "4 variantdan to'g'risini topib, o'z tomonidagi tugmani bosasiz",
      "Kim tez va to'g'ri bossa — ball olinadi, xato bo'lsa — raqibga imkoniyat",
      "5 ta savol — kim ko'proq ball to'playdi?"
    ]
  },
  {
    id: 'word-bomb', title: "Word Bomb 💣", icon: '💣', mode: 'duel',
    description: "10 soniya vaqt! To'g'ri tarjima yoki ball yo'qotasiz!",
    howToPlay: [
      "So'z beriladi — atigi 10 soniya vaqt!",
      "4 variantdan to'g'ri tarjimasini toping",
      "Vaqt tugasa — portlash! Ball raqibga o'tadi",
      "Kim portlatmay ko'proq savol yecharsa — g'alaba o'shada"
    ]
  },
  {
    id: 'definition-duel', title: "Definition Duel 📜", icon: '📜', mode: 'duel',
    description: "Ta'rifni o'qing – birinchi to'g'ri javob bergan g'alaba!",
    howToPlay: [
      "So'zning inglizcha ta'rifi o'rtada ko'rsatiladi",
      "4 variant ichidan qaysi so'z shu ta'rifga mos kelishini toping",
      "Kim birinchi to'g'ri bosса — ball o'sha o'yinchiga",
      "Ta'riflarni diqqat bilan o'qing!"
    ]
  },
  {
    id: 'emoji-battle', title: "Emoji Battle 🎮", icon: '🎮', mode: 'duel',
    description: "Emoji ko'rsatiladi – kim birinchi inglizcha so'z topadi?",
    howToPlay: [
      "Ekran o'rtasida emoji ko'rsatiladi",
      "Ikki o'yinchi ham bir vaqtda 4 variantni ko'radi",
      "Kim emoji nomini birinchi bosса — ball o'sha o'yinchiga",
      "Emojilarni yaxshi bilingmi? Sinab ko'ring!"
    ]
  },
  {
    id: 'grammar-clash', title: "Grammar Clash 🔬", icon: '🔬', mode: 'duel',
    description: "To'g'ri grammatik shaklni birinchi topuvchi g'alaba!",
    howToPlay: [
      "Grammatika savoli ikki o'yinchiga bir vaqtda ko'rsatiladi",
      "To'g'ri shaklni o'z tomoningizdan birinchi tanlang",
      "Kim to'g'ri va tez bossa — ball olinadi",
      "Grammatikani yaxshi bilish kerak!"
    ]
  },
  {
    id: 'synonym-duel', title: "Synonym Duel 🔁", icon: '🔁', mode: 'duel',
    description: "Sinonimni kim birinchi topadi!",
    howToPlay: [
      "Inglizcha so'z o'rtada ko'rsatiladi",
      "4 variant — ulardan sinonimni (o'xshash ma'no) toping",
      "Kim birinchi to'g'ri bosса — ball o'sha o'yinchiga",
      "Masalan: 'fast' → 'quick'"
    ]
  },
  {
    id: 'antonym-duel', title: "Antonym Duel 🔃", icon: '🔃', mode: 'duel',
    description: "Antonimni kim birinchi topadi!",
    howToPlay: [
      "Inglizcha so'z o'rtada ko'rsatiladi",
      "4 variant — ulardan antonimni (qarama-qarshi ma'no) toping",
      "Kim birinchi to'g'ri bosса — ball o'sha o'yinchiga",
      "Masalan: 'hot' → 'cold', 'big' → 'small'"
    ]
  },
  {
    id: 'vocab-blitz', title: "Vocab Blitz 🌪️", icon: '🌪️', mode: 'duel',
    description: "Tez tarjima tanlash musobaqasi – kim tez, o'sha g'alaba!",
    howToPlay: [
      "So'zlar tez-tez almashib ko'rinadi",
      "4 variantdan to'g'ri tarjimasini imkon qadar tez tanlang",
      "Har to'g'ri javob uchun ball — xato ball yo'qotish",
      "Kim ko'proq ball to'plasa — g'alaba o'shada"
    ]
  },
  {
    id: 'sentence-fix', title: "Sentence Fix 🔧", icon: '🔧', mode: 'duel',
    description: "Noto'g'ri gapni kim birinchi tuzatadi?",
    howToPlay: [
      "Noto'g'ri inglizcha gap ko'rsatiladi",
      "4 variant ichidan to'g'ri versiyasini toping",
      "Kim birinchi to'g'ri bosса — ball olinadi",
      "Grammatika va lug'at bilimingizni ishga soling!"
    ]
  },
  {
    id: 'word-race', title: "Word Race 🏁", icon: '🏁', mode: 'duel',
    description: "Harflarni ketma-ket to'g'ri joylashtirib so'z hosil qiling.",
    howToPlay: [
      "So'zning harflari alohida-alohida ko'rsatiladi",
      "Ikki o'yinchi harflarni to'g'ri tartibda bosadi",
      "Kim birinchi to'liq so'zni to'g'ri tuzsa — ball olinadi",
      "Tezlik muhim, lekin xato qilmaslik yanada muhimroq"
    ]
  },
  {
    id: 'sentence-sprint', title: "Sentence Sprint 🏃", icon: '🏃', mode: 'duel',
    description: "Gapni tez tuzib, birinchi bo'lgan g'alaba!",
    howToPlay: [
      "Aralashtirilgan so'zlardan inglizcha gap tuzish kerak",
      "Ikki o'yinchi bir vaqtda tezda so'zlarni tartibga soladi",
      "Kim birinchi to'g'ri gapni tuzsа — ball o'sha o'yinchiga",
      "Fikrlash tezligi va grammatika bilimi test qilinadi"
    ]
  },
  {
    id: 'phrase-builder', title: "Phrase Builder 🧠", icon: '🧠', mode: 'duel',
    description: "Inglizcha iborani to'g'ri tuzing.",
    howToPlay: [
      "O'zbekcha ibora (phrase) ko'rsatiladi",
      "Inglizcha ekvivalentini so'zlardan tuzish kerak",
      "Ikki o'yinchi raqobatlashadi — kim tez va to'g'ri tugatsа g'alaba",
      "Masalan: 'go to school' → 'maktabga bormoq'"
    ]
  },

  // =========== TEAM GAMES (19) ===========
  {
    id: 'tug-of-war', title: "Arqon Tortish 🪢 ⭐", icon: '🪢', mode: 'team',
    description: "Real-time arqon tortish: to'g'ri javob arqonni tortadi! (3 daraja)",
    howToPlay: [
      "Ikki jamoa (har birida 3 kishi) arqon tortishadi",
      "Savol chiqadi — jamoa a'zolaridan biri tez javob beradi",
      "To'g'ri javob arqonni o'z tomoningizga tortadi",
      "Arqonni chetga olib chiqgan jamoa g'alaba qiladi!"
    ]
  },
  {
    id: 'team-quiz', title: "Team Quiz 🙋", icon: '🙋', mode: 'team',
    description: "Jamoalar navbat bilan tarjima savollariga javob beradi.",
    howToPlay: [
      "Jamoalar navbat bilan savollarga javob beradi",
      "Har bir savolda 30 soniya vaqt beriladi",
      "To'g'ri javob — 1 ball, noto'g'ri javob — 0",
      "Belgilangan ballga birinchi yetgan jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'memory-match', title: "Memory Match 🧩", icon: '🧩', mode: 'team',
    description: "Tarjima kartochkalarining juftliklarini ochish.",
    howToPlay: [
      "Kartochkalar yopiq holda stol ustida yotadi",
      "Navbat bilan 2 ta kartochka ochiladi — o'zbekcha va inglizcha juft",
      "Agar juft bo'lsa — olinadi, juft bo'lmasa — yopiladi",
      "Kim ko'proq juft topsa — g'alaba o'shada"
    ]
  },
  {
    id: 'word-chain', title: "Word Chain 🔗", icon: '🔗', mode: 'team',
    description: "Oxirgi harfdan yangi inglizcha so'z yozish estafetasi.",
    howToPlay: [
      "Birinchi o'yinchi inglizcha so'z aytadi",
      "Keyingi o'yinchi o'sha so'zning OXIRGI harfidan boshlanadigan yangi so'z aytadi",
      "Masalan: 'apple' → 'elephant' → 'tree'",
      "So'z ayta olmagan yoki takrorlagan o'yinchi chiqib ketadi"
    ]
  },
  {
    id: 'hot-seat', title: "Hot Seat 🔥", icon: '🔥', mode: 'team',
    description: "Teskari o'tirgan o'quvchiga inglizcha tushuntirish yarishi.",
    howToPlay: [
      "Bir o'yinchi 'issiq o'rindig'a o'tiradi va doskaga qaramaydi",
      "Ekranda inglizcha so'z chiqadi — jamoasi inglizcha tushuntiradi",
      "Hot Seat o'yinchi so'zni inglizcha atash kerak",
      "Belgilangan vaqtda eng ko'p so'z topgan jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'pictionary', title: "Pictionary 🎨", icon: '🎨', mode: 'team',
    description: "Doskada rasm chiziladi, jamoasi inglizchasini topadi.",
    howToPlay: [
      "Navbat bilan bir o'yinchi so'z oladi va doskaga rasm chizadi",
      "So'z aytish, harflarni yozish TAQIQLANGAN",
      "Jamoasi rasm asosida inglizcha so'zni topadi",
      "1 daqiqa vaqt — topilsa ball, topilmasa — o'tkazib yuboriladi"
    ]
  },
  {
    id: 'category-sort', title: "Category Sort 🗂️", icon: '🗂️', mode: 'team',
    description: "So'zlarni guruhlarga saralash.",
    howToPlay: [
      "Ekranda inglizcha so'zlar va kategoriyalar ko'rsatiladi",
      "Jamoalar so'zlarni to'g'ri kategoriyaga suradilar",
      "Masalan: 'dog, cat, bird' → Animals; 'red, blue' → Colors",
      "Barcha so'zlarni to'g'ri joylagan eng tez jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'vocabulary-bingo', title: "Vocabulary Bingo 🎰", icon: '🎰', mode: 'team',
    description: "5x5 bingo! O'qituvchi o'zbekcha o'qiydi – inglizchani topib belgilang!",
    howToPlay: [
      "Har o'yinchi 5x5 bingo kartochka oladi — ichida inglizcha so'zlar",
      "O'qituvchi o'zbekcha so'z o'qiydi — siz inglizchani kartochkangizdan toping",
      "Topilgan so'z belgilanadi (qog'oz yoki ekranda)",
      "Kim birinchi 5 ta ketma-ket to'ldirsa — 'BINGO!' deb qichqiradi"
    ]
  },
  {
    id: 'english-taboo', title: "English Taboo 🚫", icon: '🚫', mode: 'team',
    description: "So'zni taqiqlangan so'zlarsiz tushuntiring!",
    howToPlay: [
      "Karta olasiz — asosiy so'z va 5 ta 'taqiqlangan' so'z yozilgan",
      "Asosiy so'zni taqiqlangan so'zlarsiz inglizcha tushuntiring",
      "Jamoasi so'zni topsa — ball, taqiqlangan so'z ishlatilsa — minus",
      "1 daqiqada eng ko'p so'z tushuntirgan jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'team-spelling', title: "Jamoaviy Spelling 🔤", icon: '🔤', mode: 'team',
    description: "Jamoalar navbat bilan so'zlarni inglizcha harflab yozadi.",
    howToPlay: [
      "O'zbekcha so'z chiqadi — jamoa birgalikda inglizcha harflab aytadi",
      "Bir o'yinchi harflab aytadi, qolganlar yordam berishi mumkin",
      "To'g'ri harflasa — ball, xato qilsa — raqib jamoaga imkoniyat",
      "Musobaqada eng ko'p ball to'plagan jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'word-pyramid', title: "So'z Piramidasi 🔺", icon: '🔺', mode: 'team',
    description: "Keng kategoriyadan aniq so'zga qarab: kim ko'proq biladi?",
    howToPlay: [
      "Piramida tepasidan keng kategoriya beriladi (masalan: 'Food')",
      "Har qatlam pastga tushgan sayin aniqroq so'z topish kerak",
      "Masalan: Food → Fruit → Tropical → Mango",
      "Piramidaning tubigacha yetgan jamoa eng ko'p ball oladi"
    ]
  },
  {
    id: 'vocab-relay', title: "Lug'at Estafetasi 🏃", icon: '🏃', mode: 'team',
    description: "Navbat bilan tarjima qiling – zanjirni uzmasdan!",
    howToPlay: [
      "Jamoalar navbat bilan bir-biriga so'z uzatadi",
      "Har o'yinchi o'zbekcha so'zni inglizchaga tarjima qiladi",
      "Xato qilsa — zanjir uziladi va ball raqibga o'tadi",
      "Uzluksiz eng ko'p so'z tarjima qilgan jamoa g'alaba"
    ]
  },
  {
    id: 'story-builder', title: "Hikoya Quruvchi 📖", icon: '📖', mode: 'team',
    description: "Inglizcha so'zlardan qo'shib hikoya qurishda raqobat!",
    howToPlay: [
      "Jamoaga 10 ta inglizcha so'z beriladi",
      "2 daqiqa vaqt — o'sha so'zlardan foydalanib qisqa hikoya yarating",
      "Har bir to'g'ri ishlatilgan so'z uchun ball",
      "O'qituvchi eng ijodiy hikoyani belgilaydi"
    ]
  },
  {
    id: 'word-wheel', title: "So'z G'ildiragi 🎡", icon: '🎡', mode: 'team',
    description: "G'ildirak aylantiring, kategoriya chiqadi – o'sha sohadan so'z ayting!",
    howToPlay: [
      "Ekrandagi g'ildirak aylantiriladi — kategoriya to'xtaydi",
      "O'sha kategoriyadan inglizcha so'z aytish kerak (masalan: Animals → 'elephant')",
      "Bir xil so'z takrorlanmaydi — takrorlagan yoki ayta olmagan chiqadi",
      "Eng ko'p so'z aytgan jamoa g'alaba qiladi"
    ]
  },
  {
    id: 'grammar-team', title: "Grammatika Jamoasi 📐", icon: '📐', mode: 'team',
    description: "Noto'g'ri gaplarni jamoaviy tuzatish musobaqasi.",
    howToPlay: [
      "Ekranda noto'g'ri inglizcha gap ko'rsatiladi",
      "Jamoalar bir-biridan tez xatoni topib, to'g'ri shaklini aytishadi",
      "To'g'ri javob bergan jamoa ball oladi",
      "5 ta gap — kim ko'proq to'g'ri topsa, g'alaba o'shada"
    ]
  },
  {
    id: 'speed-sort', title: "Tezkor Saralash 🌀", icon: '🌀', mode: 'team',
    description: "So'zlarni kategoriyalarga tez-tez joylashtiring!",
    howToPlay: [
      "Ekranda inglizcha so'zlar va 2-3 kategoriya chiqadi",
      "Jamoalar so'zlarni to'g'ri kategoriyaga iloji boricha tez suradilar",
      "Vaqt tugaganda — to'g'ri joylangan so'zlar hisoblanadi",
      "Kim ko'proq to'g'ri joylashtirsa — ball o'sha jamoaga"
    ]
  },
  {
    id: 'category-quiz', title: "Category Quiz 🎯", icon: '🎯', mode: 'team',
    description: "Kategoriyaviy savol-javob musobaqasi.",
    howToPlay: [
      "Kategoriya beriladi — masalan 'Body Parts' yoki 'Colors'",
      "O'sha kategoriyadan inglizcha so'zlar aytish kerak",
      "Belgilangan vaqtda takrorlama va xatosiz eng ko'p so'z aytgan jamoa g'alaba",
      "Navbatma-navbat so'z aytiladi — ayta olmagan chiqadi"
    ]
  },
  {
    id: 'memory-rush', title: "Memory Rush 🧠", icon: '🧩', mode: 'team',
    description: "Xotira kartalarini tez topish bilan g'alaba!",
    howToPlay: [
      "Ko'p kartochka yopiq holda ekranda ko'rsatiladi",
      "Vaqt boshlanadi — jamoalar navbat bilan kartochka ochadi",
      "O'zbekcha-inglizcha juftni topganlar — olib qoladi",
      "Vaqt tugaganda — kim ko'proq juft yig'sa g'alaba o'shada"
    ]
  },
  {
    id: 'picture-quest', title: "Picture Quest 🖼️", icon: '🖼️', mode: 'team',
    description: "Chizilgan rasm asosida so'zni toping.",
    howToPlay: [
      "Ekranda rasm ko'rsatiladi (avtomatik yoki o'qituvchi chizgan)",
      "Jamoalar rasm asosida inglizcha so'zni topishga harakat qiladi",
      "Kim birinchi to'g'ri javob bersa — ball o'sha jamoaga",
      "5 ta rasm — kim ko'proq to'g'ri topsa, g'alaba o'shada"
    ]
  },

  // =========== NEW UNIQUE GAMES (3) ===========
  {
    id: 'odd-one-out', title: "Odd One Out 🎭", icon: '🎭', mode: 'solo',
    description: "4 ta so'z ichidan kategoriyaga mos kelmaydigan birini toping!",
    howToPlay: [
      "Ekranda 4 ta inglizcha so'z ko'rsatiladi",
      "Ulardan biri boshqalarga mos kelmaydi — qaysi biri?",
      "Masalan: 'cat, dog, car, bird' → 'car' (hayvon emas)",
      "To'g'ri javob berganingiz uchun ball — qancha tez, shuncha ko'p"
    ]
  },
  {
    id: 'analogy-quiz', title: "Analogiya Testi 🔗", icon: '🔗', mode: 'duel',
    description: "So'z munosabatlarini topish musobaqasi: A → B :: C → ?",
    howToPlay: [
      "Ekranda analogiya ko'rsatiladi: 'Katta → Big :: Kichik → ?'",
      "To'g'ri javobni 4 variantdan topish kerak",
      "Kim birinchi to'g'ri javob bersa — ball o'sha o'yinchiga",
      "Masalan: 'Hot → Cold :: Day → Night'"
    ]
  },
  {
    id: 'password-game', title: "Parol O'yini 🔑", icon: '🔑', mode: 'team',
    description: "Bir so'z bilan belgi bering — jamoa so'zni topsın!",
    howToPlay: [
      "Bir o'yinchi so'z oladi — jamoasiga FAQAT BITTA inglizcha so'z bilan belgi beradi",
      "Jamoa shu belgidan asosiy so'zni topishga harakat qiladi",
      "Masalan: so'z 'ocean' → belgi 'waves' → jamoa 'ocean' deydi",
      "3 ta urinish — to'g'ri topilsa ball, topilmasa — raqib jamoaga imkoniyat"
    ]
  },
];

export default function SetupScreen({
  teamLeft,
  teamRight,
  maxScore,
  useCustomVocabulary,
  onStartGame,
  onOpenTeacherSettings,
  onOpenShadowing
}: SetupScreenProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>('word-duel');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('beginner');
  const [activeTabMode, setActiveTabMode] = useState<GameMode>('duel');
  const [showInstructions, setShowInstructions] = useState(true);

  const handleStart = () => {
    sound.playCorrect();
    onStartGame({ selectedGame, selectedDifficulty, teamLeft, teamRight, maxScore });
  };

  const selectGame = (gameId: GameType) => {
    sound.playTap();
    setSelectedGame(gameId);
    setShowInstructions(true);
  };

  const changeTabMode = (mode: GameMode) => {
    sound.playTap();
    setActiveTabMode(mode);
    const match = ALL_GAMES.find(g => g.mode === mode);
    if (match) setSelectedGame(match.id);
    setShowInstructions(true);
  };

  const modeGames = ALL_GAMES.filter(g => g.mode === activeTabMode);
  const selectedMeta = ALL_GAMES.find(g => g.id === selectedGame);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 select-none animate-fade-in text-center">

      {/* Header */}
      <div className="relative mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/8 blur-3xl pointer-events-none rounded-full" />
        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 uppercase tracking-widest block mb-1">
          ENGLISH LEARNING ARENA
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
          IT SHAHARCHA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">XATIRCHI</span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-xs md:text-sm mt-2 leading-relaxed">
          54 ta interaktiv o'yin! Headway kitobiga asoslangan. Har bir o'yin ingliz tilini mukammal o'rgatadi.
        </p>
      </div>

      {/* Shadowing section entry */}
      <div className="mb-6">
        <button
          onClick={() => { sound.playTap(); onOpenShadowing(); }}
          className="w-full max-w-2xl mx-auto flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400/70 rounded-3xl px-6 py-4 cursor-pointer transition-all group shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">Yangi bo'lim ✨</p>
              <h3 className="text-base font-black text-white">🎤 Shadowing Mashqi</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Tinglang → Gapirib ko'ring → Talaffuzingizni baholang</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded-full font-black uppercase">
              54 mashq
            </span>
            <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* Left: Game Selection */}
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-xl space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>O'yinlar to'plami</span>
                <span className="bg-cyan-500/20 text-cyan-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {ALL_GAMES.length} ta
                </span>
              </h2>

              <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['solo', 'duel', 'team'] as GameMode[]).map(mode => {
                  const labels: Record<GameMode, string> = { solo: 'Yakka', duel: 'Duel', team: 'Jamoa' };
                  const colors: Record<GameMode, string> = { solo: 'bg-amber-500', duel: 'bg-cyan-500', team: 'bg-rose-500' };
                  return (
                    <button
                      key={mode}
                      onClick={() => changeTabMode(mode)}
                      className={`px-3 py-1 font-extrabold uppercase text-[10px] rounded-lg transition-all ${
                        activeTabMode === mode ? `${colors[mode]} text-slate-950 shadow-md` : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {modeGames.map((game) => {
                const isSelected = selectedGame === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => selectGame(game.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-900 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="text-2xl mt-0.5 flex-shrink-0">{game.icon}</span>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-black uppercase truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {game.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal line-clamp-2">
                        {game.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Settings + Instructions */}
        <div className="space-y-4 text-left">
          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-xl space-y-4">

            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                Sozlamalar
              </h3>
              <button
                onClick={() => { sound.playTap(); onOpenTeacherSettings(); }}
                className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-black text-amber-400 hover:text-white uppercase transition-all"
              >
                O'zgartirish
              </button>
            </div>

            {/* How to Play — always visible when game selected */}
            {selectedMeta && (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 overflow-hidden">
                <button
                  onClick={() => setShowInstructions(v => !v)}
                  className="w-full p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-indigo-900/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <div className="text-left">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Qanday o'ynash kerak?</span>
                      <span className="text-xs font-black text-white">{selectedMeta.icon} {selectedMeta.title}</span>
                    </div>
                  </div>
                  {showInstructions
                    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  }
                </button>
                {showInstructions && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {selectedMeta.howToPlay.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[9px] font-black flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[10px] text-slate-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Teams */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Faol Jamoalar:</span>
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span style={{ color: teamLeft.color }} className="flex items-center gap-1">
                  <span>{teamLeft.emoji}</span> {teamLeft.name}
                </span>
                <span className="text-slate-500">vs</span>
                <span style={{ color: teamRight.color }} className="flex items-center gap-1">
                  {teamRight.name} <span>{teamRight.emoji}</span>
                </span>
              </div>
            </div>

            {/* Max score */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase font-black">G'alaba chegarasi:</span>
              <span className="text-xs font-bold font-mono text-emerald-400">{maxScore} Ball</span>
            </div>

            {/* Vocabulary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase font-black">Lug'at:</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase">
                {useCustomVocabulary ? 'Shaxsiy 📝' : 'Standart 🗂️'}
              </span>
            </div>

            {/* Difficulty */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Daraja:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['beginner', 'elementary', 'advanced'] as const).map((level) => {
                  const labels = { beginner: 'Beginner', elementary: 'Elementary', advanced: 'Advanced' };
                  return (
                    <button
                      key={level}
                      onClick={() => { sound.playTap(); setSelectedDifficulty(level); }}
                      className={`py-2 rounded-xl border text-[9px] uppercase font-black transition-all ${
                        selectedDifficulty === level
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 hover:from-cyan-400 hover:via-indigo-400 hover:to-rose-400 text-slate-950 text-sm font-black uppercase py-3.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 shadow-xl transition-all cursor-pointer border border-white/20"
            >
              Bellashuvni boshlash
              <ArrowRight className="w-5 h-5" strokeWidth="2.5" />
            </button>

          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl flex items-center justify-center gap-2 max-w-lg mx-auto">
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-[10px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">
          UZBEKISTAN INTERACTIVE WHITEBOARD SYSTEM PRO — 54 O'YIN
        </span>
      </div>
    </div>
  );
}
