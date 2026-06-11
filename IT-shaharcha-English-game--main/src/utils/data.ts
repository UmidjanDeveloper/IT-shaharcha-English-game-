import { WordPair } from '../types';

export const standardCategories: { name: string; tag: string; words: WordPair[] }[] = [
  {
    name: "IT va Kompyuter savodxonligi",
    tag: "it",
    words: [
      { uz: 'Kompyuter', en: 'Computer' },
      { uz: 'Klaviatura', en: 'Keyboard' },
      { uz: 'Dasturchi', en: 'Programmer' },
      { uz: 'Ekran', en: 'Screen' },
      { uz: 'Sichqoncha', en: 'Mouse' },
      { uz: 'Internet', en: 'Internet' },
      { uz: 'Tugma', en: 'Button' },
      { uz: 'Koder', en: 'Coder' },
      { uz: 'Tarmoq', en: 'Network' },
      { uz: 'Xavfsizlik', en: 'Security' },
      { uz: 'Ma\'lumot', en: 'Data' },
      { uz: 'Fayl', en: 'File' },
      { uz: 'Dastur', en: 'Software' },
      { uz: 'Nusxalash', en: 'Copy' },
      { uz: 'Joylashtirish', en: 'Paste' }
    ]
  },
  {
    name: "Meva va Sabzavotlar",
    tag: "fruits",
    words: [
      { uz: 'Olma', en: 'Apple' },
      { uz: 'Banan', en: 'Banana' },
      { uz: 'Limon', en: 'Lemon' },
      { uz: 'Uzum', en: 'Grape' },
      { uz: 'Nok', en: 'Pear' },
      { uz: 'Apelsin', en: 'Orange' },
      { uz: 'Tarvuz', en: 'Watermelon' },
      { uz: 'Gilos', en: 'Cherry' },
      { uz: 'Anor', en: 'Pomegranate' },
      { uz: 'Qulupnay', en: 'Strawberry' },
      { uz: 'Sabzi', en: 'Carrot' },
      { uz: 'Bodring', en: 'Cucumber' },
      { uz: 'Pomidor', en: 'Tomato' },
      { uz: 'Kartoshka', en: 'Potato' },
      { uz: 'Piyoz', en: 'Onion' }
    ]
  },
  {
    name: "Hayvonlar",
    tag: "animals",
    words: [
      { uz: 'Mushuk', en: 'Cat' },
      { uz: 'Kuchuk', en: 'Dog' },
      { uz: 'Arslon', en: 'Lion' },
      { uz: 'Yo\'lbars', en: 'Tiger' },
      { uz: 'Ayiq', en: 'Bear' },
      { uz: 'Qush', en: 'Bird' },
      { uz: 'Baliq', en: 'Fish' },
      { uz: 'Fil', en: 'Elephant' },
      { uz: 'Maymun', en: 'Monkey' },
      { uz: 'Quyon', en: 'Rabbit' },
      { uz: 'Ot', en: 'Horse' },
      { uz: 'Tovuq', en: 'Chicken' },
      { uz: 'G`oz', en: 'Goose' },
      { uz: 'Cho\'chqa', en: 'Pig' },
      { uz: 'Tovon', en: 'Donkey' }
    ]
  },
  {
    name: "Maktab va Oila",
    tag: "school",
    words: [
      { uz: 'Kitob', en: 'Book' },
      { uz: 'Maktab', en: 'School' },
      { uz: 'O\'qituvchi', en: 'Teacher' },
      { uz: 'O\'quvchi', en: 'Student' },
      { uz: 'Ruchka', en: 'Pen' },
      { uz: 'Daftar', en: 'Notebook' },
      { uz: 'Sinfxona', en: 'Classroom' },
      { uz: 'Doska', en: 'Board' },
      { uz: 'Oila', en: 'Family' },
      { uz: 'Do\'st', en: 'Friend' },
      { uz: 'Uy', en: 'Home' },
      { uz: 'Do\'kon', en: 'Shop' },
      { uz: 'Daftar', en: 'Exercise book' },
      { uz: 'Dars', en: 'Lesson' },
      { uz: 'Imtihon', en: 'Exam' }
    ]
  },
  {
    name: "Kundalik Harakatlar (Fe'llar)",
    tag: "verbs",
    words: [
      { uz: 'Yugurish', en: 'Run' },
      { uz: 'Sakrash', en: 'Jump' },
      { uz: 'O\'qish', en: 'Read' },
      { uz: 'Yozish', en: 'Write' },
      { uz: 'Gapirish', en: 'Speak' },
      { uz: 'Eshitish', en: 'Listen' },
      { uz: 'Kulish', en: 'Laugh' },
      { uz: 'O\'yin', en: 'Play' },
      { uz: 'Rasm chizish', en: 'Draw' },
      { uz: 'Yordam berish', en: 'Help' },
      { uz: 'Pishirish', en: 'Cook' },
      { uz: 'Tozalash', en: 'Clean' },
      { uz: 'Yugurmoq', en: 'Jog' },
      { uz: 'Kelmoq', en: 'Come' },
      { uz: 'Borish', en: 'Go' }
    ]
  }
];

const BEGINNER_WORDS: WordPair[] = [
  { uz: 'Salom', en: 'Hello' },
  { uz: 'Rahmat', en: 'Thank you' },
  { uz: 'Iltimos', en: 'Please' },
  { uz: 'Ha', en: 'Yes' },
  { uz: 'Yo\'q', en: 'No' },
  { uz: 'Bugun', en: 'Today' },
  { uz: 'Ertaga', en: 'Tomorrow' },
  { uz: 'Bugun', en: 'Today' },
  { uz: 'Uy', en: 'Home' },
  { uz: 'Kitob', en: 'Book' },
  { uz: 'Maktab', en: 'School' },
  { uz: 'O\'qituvchi', en: 'Teacher' },
  { uz: 'O\'quvchi', en: 'Student' },
  { uz: 'Olma', en: 'Apple' },
  { uz: 'Banan', en: 'Banana' },
  { uz: 'Hayvon', en: 'Animal' },
  { uz: 'Ot', en: 'Horse' },
  { uz: 'Kuchuk', en: 'Dog' },
  { uz: 'Mushuk', en: 'Cat' },
  { uz: 'Yugurish', en: 'Run' },
  { uz: 'Sakrash', en: 'Jump' },
  { uz: 'Yozish', en: 'Write' },
  { uz: 'Rasm chizish', en: 'Draw' },
  { uz: 'O\'yin', en: 'Play' },
  { uz: 'Gapirish', en: 'Speak' },
  { uz: 'Eshitish', en: 'Listen' }
];

const ELEMENTARY_WORDS: WordPair[] = [
  { uz: 'Do\'stlik', en: 'Friendship' },
  { uz: 'Havoda', en: 'Air' },
  { uz: 'Musiqa', en: 'Music' },
  { uz: 'Sayohat', en: 'Trip' },
  { uz: 'Xabar', en: 'Message' },
  { uz: 'Jamoa', en: 'Team' },
  { uz: 'Mashq', en: 'Practice' },
  { uz: 'Yordam', en: 'Help' },
  { uz: 'Sabr', en: 'Patience' },
  { uz: 'Oila', en: 'Family' },
  { uz: 'Lagaj', en: 'Orange' },
  { uz: 'Gul', en: 'Flower' },
  { uz: 'Rang', en: 'Color' },
  { uz: 'Dars', en: 'Lesson' },
  { uz: 'Qo\'l', en: 'Hand' },
  { uz: 'Ko\'z', en: 'Eye' },
  { uz: 'Ovoz', en: 'Voice' },
  { uz: 'Qiziqarli', en: 'Interesting' },
  { uz: 'Ustoz', en: 'Mentor' },
  { uz: 'Kitobxon', en: 'Reader' }
];

const ADVANCED_WORDS: WordPair[] = [
  { uz: 'Rivojlantirmoq', en: 'Develop' },
  { uz: 'Taqdim etmoq', en: 'Present' },
  { uz: 'Tushunmoq', en: 'Understand' },
  { uz: 'Imkoniyat', en: 'Opportunity' },
  { uz: 'Tajriba', en: 'Experience' },
  { uz: 'Sayohat qilmoq', en: 'Travel' },
  { uz: 'Ehtiyotkorlik', en: 'Caution' },
  { uz: 'Harakat qilmoq', en: 'Attempt' },
  { uz: 'Zaruriy / kerakli', en: 'Necessary' },
  { uz: 'Qaror qabul qilmoq', en: 'Decide' },
  { uz: 'Yaxshilamoq', en: 'Improve' },
  { uz: 'Muallif / yozuvchi', en: 'Author' },
  { uz: 'Tanishmoq / tanishtirmoq', en: 'Introduce' },
  { uz: 'Kashf qilmoq', en: 'Discover' },
  { uz: 'Tarixiy obida', en: 'Historical' },
  { uz: 'Maslahat bermoq', en: 'Advise' },
  { uz: 'Niyat / maqsad', en: 'Purpose' },
  { uz: 'Erishmoq / muvaffaqiyat', en: 'Achieve' },
  { uz: 'Ta’sir qilmoq', en: 'Influence' },
  { uz: 'Tavsiya qilmoq', en: 'Recommend' },
  { uz: 'G’alaba / yutuq', en: 'Victory' },
  { uz: 'Tasvirlamoq', en: 'Describe' },
  { uz: 'Solishtirmoq', en: 'Compare' },
  { uz: 'Qiyinchilik / masayqat', en: 'Difficulty' },
  { uz: 'Izohlamoq / tushuntirmoq', en: 'Explain' },
  { uz: 'Tergov qilmoq / tekshirmoq', en: 'Investigate' },
  { uz: 'E’tiroz bildirmoq', en: 'Object' },
  { uz: 'Cheklamoq', en: 'Restrict' },
  { uz: 'Nizoni hal qilmoq', en: 'Settle' },
  { uz: 'Tashvishlanish / xavotir', en: 'Anxiety' },
  { uz: 'Kamaytirish / qisqartirish', en: 'Reduction' },
  { uz: 'Noyob / g’ayrioddiy', en: 'Extraordinary' },
  { uz: 'Isbotlamoq / tekshirib ko’rmoq', en: 'Verify' },
  { uz: 'Samarali / unumdor', en: 'Efficient' },
  { uz: 'Ilhomlantirmoq', en: 'Inspire' },
  { uz: 'Moslashmoq / o’rganish', en: 'Adapt' },
  { uz: 'Ziddiyat / kelishmovchilik', en: 'Conflict' },
  { uz: 'Boyitmoq / rivojlantirmoq', en: 'Enrich' },
  { uz: 'Raqobatlashmoq', en: 'Compete' },
  { uz: 'Kafolatlamoq / va’da bermoq', en: 'Guarantee' },
  { uz: 'Foyda keltiradigan', en: 'Beneficial' },
  { uz: 'Munosib bo’lmoq', en: 'Deserve' },
  { uz: 'Faraz qilmoq / tahmin qilmoq', en: 'Assume' },
  { uz: 'Xabardorlik / sezgirlik', en: 'Awareness' },
  { uz: 'Hissa qo’shmoq', en: 'Contribute' },
  { uz: 'Baholash / qiymat berish', en: 'Assessment' },
  { uz: 'Muqobil variant', en: 'Alternative' },
  { uz: 'Hamkorlik qilmoq', en: 'Collaborate' },
  { uz: 'Izchil / mantiqiy tartib', en: 'Consistent' },
  { uz: 'Kengaytirish / o’stirish', en: 'Expand' },
  { uz: 'Hamma joyda mavjud bo’lgan', en: 'Ubiquitous' },
  { uz: 'Fikrlash tarzi / namuna / mezon', en: 'Paradigm' },
  { uz: 'Xulosa chiqarmoq / extrapolation', en: 'Extrapolate' },
  { uz: 'Yarashtirish / muvofiqlashtirish', en: 'Reconcile' },
  { uz: 'Yonma-yon qo’yish / solishtirish', en: 'Juxtapose' },
  { uz: 'O’jarlik / gapga kirmaslik', en: 'Recalcitrant' },
  { uz: 'Vazminlik / xotirjamlik', en: 'Equanimity' },
  { uz: 'Kuchli moyillik / intilish', en: 'Proclivity' },
  { uz: 'Murakkab jumboq / boshqotirma', en: 'Conundrum' },
  { uz: 'Maqtovga loyiq / munosib', en: 'Meritorious' },
  { uz: 'Dalillar bilan isbotlamoq', en: 'Substantiate' },
  { uz: 'Qisqa umr ko’radigan / o’tkinchi', en: 'Ephemeral' },
  { uz: 'Pinhona / yashirincha qilingan', en: 'Surreptitious' },
  { uz: 'Zerikarli / bir xildagi hayot', en: 'Monotonous' },
  { uz: 'Chuqur bilim / zakovat boyligi', en: 'Erudition' },
  { uz: 'Eng yuqori cho’qqi / kamoloti', en: 'Zenith' },
  { uz: 'Mavhum / qorong’u / noaniq', en: 'Obscure' },
  { uz: 'Chechanlik / notiqlik san’ati', en: 'Eloquence' },
  { uz: 'Chidamli / oson egilmas', en: 'Resilient' },
  { uz: 'Inkor etib bo’lmaydigan haqiqat', en: 'Irrefutable' },
  { uz: 'Amaliy / realistik yondashuv', en: 'Pragmatic' },
  { uz: 'G’ayratli / tirishqoq xodim', en: 'Assiduous' },
  { uz: 'Ruhlantiruvchi / hayajonli', en: 'Exhilarating' },
  { uz: 'Xavf / tahdid soluvchi holat', en: 'Jeopardy' },
  { uz: 'Zararsiz / ta’sirga ega bo’lmagan', en: 'Innocuous' }
];

export const beginnerVocabulary: WordPair[] = [...BEGINNER_WORDS];
export const elementaryVocabulary: WordPair[] = [...BEGINNER_WORDS, ...ELEMENTARY_WORDS];
export const advancedVocabulary: WordPair[] = [...BEGINNER_WORDS, ...ELEMENTARY_WORDS, ...ADVANCED_WORDS];

// Flat list helper for default usage
export const defaultVocabularyPairs: WordPair[] = [...advancedVocabulary];

export function getVocabularyByLevel(level: 'beginner' | 'elementary' | 'advanced' | 'custom', sourceList: WordPair[]) {
  if (level === 'beginner') return beginnerVocabulary;
  if (level === 'elementary') return elementaryVocabulary;
  if (level === 'advanced') return advancedVocabulary;
  if (level === 'custom' && sourceList.length > 0) return sourceList;
  return defaultVocabularyPairs;
}

// Sentences for "Fill in the Blank" and "Sentence Builder Duel" games
export interface GrammarSentence {
  full: string;
  scrambled: string[];
  missingWord: string; // the word to blank out
  promptUz: string; // prompt translation
}

export const sampleSentences: GrammarSentence[] = [
  {
    full: "I love programming computer programs",
    scrambled: ["computer", "I", "love", "programming", "programs"],
    missingWord: "programming",
    promptUz: "Men kompyuter dasturlarini dasturlashni yaxshi ko'raman"
  },
  {
    full: "The cat is sleeping under the table",
    scrambled: ["sleeping", "cat", "table", "The", "is", "under", "the"],
    missingWord: "sleeping",
    promptUz: "mushuk stolning tagida uxlayapti"
  },
  {
    full: "We study English at IT Shaharcha",
    scrambled: ["English", "study", "IT", "We", "at", "Shaharcha"],
    missingWord: "study",
    promptUz: "Biz IT Shaharchada ingliz tilini o'rganamiz"
  },
  {
    full: "My mother is cooking delicious apple pie",
    scrambled: ["is", "cooking", "delicious", "My", "mother", "apple", "pie"],
    missingWord: "cooking",
    promptUz: "Onam mazali olma pirogini pishiryapti"
  },
  {
    full: "Printers are used to print document pages",
    scrambled: ["used", "are", "Printers", "print", "document", "to", "pages"],
    missingWord: "print",
    promptUz: "Printerlar hujjat sahifalarini chop etish uchun ishlatiladi"
  },
  {
    full: "Computers help us solve complex math operations",
    scrambled: ["us", "Computers", "help", "solve", "math", "complex", "operations"],
    missingWord: "solve",
    promptUz: "Kompyuterlar murakkab matematika amallarini yechishga yordam beradi"
  },
  {
    full: "Our teacher wrote a message on board",
    scrambled: ["teacher", "wrote", "Our", "a", "on", "message", "board"],
    missingWord: "message",
    promptUz: "O'qituvchimiz doskaga xabar yozdi"
  }
];

// Helper methods to get and set teacher list in LocalStorage
export function getTeacherVocabulary(): WordPair[] {
  try {
    const data = localStorage.getItem('it_shaharcha_custom_vocab');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveTeacherVocabulary(list: WordPair[]): void {
  try {
    localStorage.setItem('it_shaharcha_custom_vocab', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}
