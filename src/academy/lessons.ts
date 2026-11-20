export type Level = 'beginner' | 'intermediate' | 'ielts';

export type Question = {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type Reading = {
  title: string;
  passage: string;
  translation: string;
  question: Question;
};

export type Writing = {
  title: string;
  instruction: string;
  prompt: string;
  model: string;
  criteria: { label: string; patterns: RegExp[]; hint: string }[];
  mistakes: { pattern: RegExp; note: string }[];
};

const question = (prompt: string, options: string[], correct: number, explanation: string): Question =>
  ({ prompt, options, correct, explanation });

export const readings: Record<Level, Reading[]> = {
  beginner: [
    {
      title: 'A New Classmate',
      passage: 'Amina is new at our school. She sits next to me in English class. At lunch, we share an apple and talk about our favourite games. On Friday, I invite her to play football with my friends.',
      translation: 'Amina maktabimizga yangi kelgan. Ingliz tili darsida u mening yonimda o‘tiradi. Tushlikda bitta olmani bo‘lishib yeymiz va sevimli o‘yinlarimiz haqida gaplashamiz. Juma kuni uni do‘stlarim bilan futbol o‘ynashga taklif qilaman.',
      question: question('What does Amina do at lunch?', ['She plays football.', 'She shares an apple.', 'She goes home.', 'She reads a book.'], 1, '“We share an apple” jumlasi ular olmani bo‘lishib yeyishini bildiradi.'),
    },
    {
      title: 'The School Garden',
      passage: 'There is a small garden behind our school. My class grows tomatoes and carrots there. On Mondays, we water the plants before our first lesson. In summer, we take some vegetables home.',
      translation: 'Maktabimiz orqasida kichik bog‘ bor. Sinfimiz u yerda pomidor va sabzi yetishtiradi. Dushanba kunlari birinchi darsdan oldin o‘simliklarga suv quyamiz. Yozda sabzavotlarning bir qismini uyga olib ketamiz.',
      question: question('When do the students water the plants?', ['On Fridays', 'After school', 'On Mondays', 'Every evening'], 2, '“On Mondays” dushanba kunlari degani.'),
    },
  ],
  intermediate: [
    {
      title: 'A Different Way to Travel',
      passage: 'Last year, our town built a cycle lane between the market and the bus station. At first, few people used it because they were worried about traffic at the junctions. After the town added traffic lights for cyclists, more people started riding to work. One shop owner now delivers orders by bicycle whenever the weather is good.',
      translation: 'O‘tgan yili shahrimiz bozor bilan avtovokzal oralig‘ida velosiped yo‘lagini qurdi. Dastlab undan kam odam foydalandi, chunki ular chorrahalardagi tirbandlikdan xavotirda edilar. Shahar velosipedchilar uchun svetoforlar o‘rnatgach, ko‘proq odam ishga velosipedda qatnay boshladi. Endi bir do‘kon egasi ob-havo yaxshi bo‘lganida buyurtmalarni velosipedda yetkazib beradi.',
      question: question('What encouraged more people to cycle to work?', ['Lower shop prices', 'A new bus station', 'Better weather', 'Traffic lights for cyclists'], 3, '“After the town added traffic lights for cyclists” keyingi o‘zgarish qachon boshlanganini ko‘rsatadi.'),
    },
    {
      title: 'A Library of Things',
      passage: 'Instead of buying a drill for a single job, residents can borrow one from the local library. The scheme also lends sewing machines and gardening tools. Members pay a small annual fee, which covers repairs. The organisers hope the service will reduce waste by making rarely used items available to many people.',
      translation: 'Mahalliy aholi bir martalik ish uchun drel sotib olish o‘rniga uni kutubxonadan olib turishi mumkin. Loyiha doirasida tikuv mashinalari va bog‘dorchilik asboblari ham beriladi. A’zolar ta’mirlash xarajatlarini qoplash uchun kichik yillik badal to‘laydi. Tashkilotchilar kam ishlatiladigan buyumlardan ko‘pchilik foydalansa, chiqindilar kamayishiga umid qilmoqda.',
      question: question('What is one aim of the scheme?', ['To reduce waste', 'To sell more tools', 'To offer free repairs to everyone', 'To replace local shops'], 0, 'Matnda “reduce waste” loyihaning maqsadi sifatida bevosita aytilgan.'),
    },
  ],
  ielts: [
    {
      title: 'Urban Trees and Summer Heat',
      passage: 'Urban trees can lower daytime temperatures by providing shade and releasing moisture. However, their cooling effect depends on where they are planted. Researchers found that compact rows of trees helped pedestrians on exposed streets, while in narrow streets a very dense canopy sometimes slowed air movement. The researchers suggested that planners assess each street individually before choosing a planting design.',
      translation: 'Shahardagi daraxtlar soya berish va namlik chiqarish orqali kunduzgi haroratni pasaytirishi mumkin. Biroq ularning sovitish ta’siri qayerga ekilganiga bog‘liq. Tadqiqotchilar zich qator bo‘lib ekilgan daraxtlar ochiq ko‘chalarda piyodalarga yordam berganini, tor ko‘chalarda esa juda qalin daraxt shox-shabbasi ba’zan havo harakatini sekinlashtirganini aniqladi. Ular ekish usulini tanlashdan oldin har bir ko‘chani alohida baholashni tavsiya qildi.',
      question: question('TRUE / FALSE / NOT GIVEN · The same planting design is suitable for every street.', ['TRUE', 'FALSE', 'NOT GIVEN'], 1, 'FALSE. Tadqiqotchilar har bir ko‘chani alohida baholashni tavsiya qilgan. Matnda ko‘cha turiga qarab daraxtlarning ta’siri o‘zgarishi aytilgan.'),
    },
    {
      title: 'The Repair Café',
      passage: 'A repair café connects people who have broken household items with volunteers who know how to fix them. Unlike commercial repair shops, cafés usually invite visitors to take part in the work. Supporters argue that this helps visitors build confidence and learn skills they can apply at home. Some cafés ask for donations to cover the cost of replacement parts.',
      translation: 'Ta’mirlash kafesi uy-ro‘zg‘or buyumlari buzilgan odamlarni ularni tuzata oladigan ko‘ngillilar bilan uchrashtiradi. Tijorat ta’mirlash ustaxonalaridan farqli ravishda, kafelar odatda tashrif buyuruvchilarni ishda qatnashishga taklif qiladi. Tarafdorlarning fikricha, bu odamlarga o‘ziga ishonchni oshirish va uyda qo‘llash mumkin bo‘lgan ko‘nikmalarni o‘rganishga yordam beradi. Ba’zi kafelar ehtiyot qismlar narxini qoplash uchun xayriya so‘raydi.',
      question: question('TRUE / FALSE / NOT GIVEN · Most volunteers have received formal training in repair work.', ['TRUE', 'FALSE', 'NOT GIVEN'], 2, 'NOT GIVEN. Matnda ko‘ngillilar tuzatishni bilishi aytiladi. Ularning rasmiy ta’lim olgani haqida ma’lumot berilmagan.'),
    },
    {
      title: 'From Rooftop to River',
      passage: 'When a city replaces soil with concrete, rainwater reaches rivers faster. Green roofs slow this process because their soil and plants hold some of the water. The amount they retain varies with the depth of the soil and how wet it is before the rain begins. For that reason, a roof may hold less water during the second of two storms that occur close together.',
      translation: 'Shaharda tuproq o‘rnini beton egallasa, yomg‘ir suvi daryolarga tezroq yetib boradi. O‘simlik ekilgan tomlar bu jarayonni sekinlashtiradi, chunki ularning tuprog‘i va o‘simliklari suvning bir qismini ushlab qoladi. Ushlab qolinadigan suv miqdori tuproq chuqurligi va yomg‘ir boshlanishidan oldingi namlik darajasiga bog‘liq. Shu sababli ketma-ket yog‘gan ikki jala orasida ikkinchisida tom kamroq suvni ushlab qolishi mumkin.',
      question: question('TRUE / FALSE / NOT GIVEN · A roof’s ability to retain rainwater depends partly on its existing moisture.', ['TRUE', 'FALSE', 'NOT GIVEN'], 0, 'TRUE. “How wet it is before the rain begins” iborasi tuproqning avvaldan qanchalik nam ekanini bildiradi.'),
    },
  ],
};

export const quizzes: Record<Level, Question[]> = {
  beginner: [
    question('She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1, 'Present Simple zamonida “she” bilan “go” fe’li “goes” shaklida keladi.'),
    question('“Kitob javonda.” gapining tarjimasini toping.', ['The shelf is under the book.', 'The book is in my bag.', 'The book is on the shelf.', 'The books are on the table.'], 2, '“On the shelf” tokcha yoki javon ustida degani.'),
    question('We ___ two cats at home.', ['has', 'having', 'is', 'have'], 3, '“We” bilan “have” ishlatiladi.'),
    question('Qaysi so‘z “kecha” degani?', ['Yesterday', 'Tomorrow', 'Tonight', 'Always'], 0, '“Yesterday” o‘tgan kunni bildirish uchun ishlatiladi.'),
    question('There ___ three apples on the table.', ['is', 'are', 'am', 'be'], 1, '“Three apples” ko‘plikda, shuning uchun “there are” ishlatiladi.'),
  ],
  intermediate: [
    question('I have lived here ___ 2021.', ['for', 'during', 'since', 'until'], 2, '“Since” boshlanish vaqtini, “for” esa davomiylikni bildiradi.'),
    question('If it rains tomorrow, we ___ at home.', ['stayed', 'will stay', 'would stay', 'have stayed'], 1, 'First conditional shaklida “if” qismi hozirgi zamonda, natija esa “will” bilan keladi.'),
    question('Which sentence uses the passive voice?', ['The team designed the app.', 'The team is designing an app.', 'The team has designed an app.', 'The app was designed by the team.'], 3, 'Majhul nisbat “be” fe’li va fe’lning uchinchi shakli orqali yasaladi.'),
    question('We missed the bus. ___, we arrived on time.', ['However', 'Because', 'For example', 'In addition'], 0, '“However” qarama-qarshi bo‘lgan ikki fikrni bog‘laydi.'),
    question('“Look after” qaysi ma’noni anglatadi?', ['Qidirib topmoq', 'G‘amxo‘rlik qilmoq', 'Orqaga qaramoq', 'Qaror qabul qilmoq'], 1, '“Look after” kimdir yoki nimagadir qarab turish, g‘amxo‘rlik qilish degani.'),
  ],
  ielts: [
    question('Task 1 · Which phrase describes a change from 20% to 32%?', ['Rose to 12%', 'Rose by 12 percentage points', 'Fell to 32%', 'Remained stable at 20%'], 1, '32% − 20% = 12 foiz punkt. “Rose to” yakuniy qiymatni, “rose by” o‘zgarish miqdorini bildiradi.'),
    question('Which sentence is most appropriate in a formal Task 2 essay?', ['Phones are super bad in class.', 'You know, kids just love phones.', 'Mobile phones can distract students during lessons.', 'Phones and stuff are everywhere.'], 2, 'Bu gap norasmiy iboralarsiz aniq fikr bildiradi.'),
    question('Which option best paraphrases “a growing number of residents”?', ['Fewer people living locally', 'Residents with larger houses', 'All the residents', 'An increasing number of local people'], 3, '“Increasing” va “growing” bu yerda bir xil yo‘nalishni bildiradi.'),
    question('Which linker introduces a concrete example?', ['For instance', 'Nevertheless', 'Consequently', 'In contrast'], 0, '“For instance” fikrni aniq misol bilan yoritishga xizmat qiladi.'),
    question('Task 2 · A question asks “To what extent do you agree or disagree?” What should the response include?', ['A summary of the question only', 'A clear position supported by reasons', 'A letter asking for more details', 'A list of words from the topic'], 1, 'Fikringizni aniq bayon qiling va uni izoh hamda misollar bilan asoslang.'),
  ],
};

export const writings: Record<Level, Writing[]> = {
  beginner: [
    {
      title: 'Everyday English',
      instruction: 'Gapni ingliz tiliga tarjima qiling.',
      prompt: 'Singlim har kuni kitob o‘qiydi.',
      model: 'My sister reads a book every day.',
      criteria: [
        { label: 'Ega', patterns: [/\bmy (?:younger |little )?sister\b/], hint: '“Singlim” uchun “my sister” ishlating.' },
        { label: 'Fe’l va so‘z tartibi', patterns: [/\bsister reads\b/], hint: '“Sister” uchinchi shaxs birlikda. “Read” fe’liga –s qo‘shing.' },
        { label: 'Nimani o‘qiydi', patterns: [/\breads (?:a |the )?books\b/, /\breads a book\b/], hint: '“A book” yoki umumiy ma’noda “books” ishlating.' },
        { label: 'Vaqt ifodasi', patterns: [/\bevery day\b/, /\bdaily\b/, /\beach day\b/], hint: '“Har kuni” uchun “every day” yoki “daily” mos.' },
      ],
      mistakes: [
        { pattern: /\b(?:sister|she) read\b/, note: 'Present Simple zamonida “sister” yoki “she” bilan “reads” yoziladi.' },
        { pattern: /\beveryday\b/, note: 'Vaqt ifodasida “every day” ikki so‘z qilib yoziladi.' },
        { pattern: /\breads book\b/, note: 'Birlikdagi “book” oldidan “a” artiklini qo‘ying yoki “books” yozing.' },
      ],
    },
    {
      title: 'A Healthy Habit',
      instruction: 'Gapni ingliz tiliga tarjima qiling.',
      prompt: 'Biz har kuni ertalab suv ichamiz.',
      model: 'We drink water every morning.',
      criteria: [
        { label: 'Ega', patterns: [/\bwe\b/], hint: '“Biz” ingliz tilida “we” bo‘ladi.' },
        { label: 'Fe’l va so‘z tartibi', patterns: [/\bwe drink\b/, /\bwe (?:always|usually) drink\b/], hint: '“We drink” orqali odat haqida ayting.' },
        { label: 'Ichimlik', patterns: [/\bwater\b/], hint: '“Suv” uchun “water” yozing.' },
        { label: 'Vaqt ifodasi', patterns: [/\bevery morning\b/, /\beach morning\b/], hint: '“Har kuni ertalab” uchun “every morning” yoki “each morning” ishlating.' },
      ],
      mistakes: [{ pattern: /\bwe drinks\b/, note: '“We” bilan fe’lning asosiy shakli “drink” ishlatiladi.' }],
    },
  ],
  intermediate: [
    {
      title: 'An Unfinished Task',
      instruction: 'Gapni ingliz tiliga tarjima qiling.',
      prompt: 'Men hali uy vazifamni tugatmadim.',
      model: 'I haven’t finished my homework yet.',
      criteria: [
        { label: 'Ega va inkor', patterns: [/\bi (?:have not|haven't)\b/], hint: 'Inkor shaklida “I haven’t” yoki “I have not” yozing.' },
        { label: 'Present Perfect', patterns: [/\b(?:have not|haven't) (?:yet )?(?:finished|completed|done)\b/], hint: '“Haven’t finished” shakli hozirgi holatga bog‘liq natijani bildiradi.' },
        { label: 'Uy vazifasi', patterns: [/\bmy (?:homework|assignment)\b/], hint: '“Uy vazifam” uchun “my homework” mos.' },
        { label: 'Hali', patterns: [/\byet\b/, /\bstill\b/], hint: '“Hali” ma’nosini “yet” yoki “still” bilan bering.' },
      ],
      mistakes: [
        { pattern: /\bhaven't finish\b/, note: '“Haven’t” dan keyin “finish” o‘rniga “finished” ishlating.' },
        { pattern: /\bhomeworks\b/, note: '“Homework” sanalmaydigan ot. Odatda ko‘plik qo‘shimchasi olmaydi.' },
      ],
    },
    {
      title: 'A Weekend Plan',
      instruction: 'Gapni ingliz tiliga tarjima qiling.',
      prompt: 'Agar ertaga yomg‘ir yog‘sa, biz muzeyga boramiz.',
      model: 'If it rains tomorrow, we will go to the museum.',
      criteria: [
        { label: 'Shart', patterns: [/\bif it rains\b/], hint: 'Shartni “if it rains” bilan ifodalang.' },
        { label: 'Vaqt', patterns: [/\btomorrow\b/], hint: '“Ertaga” ingliz tilida “tomorrow”.' },
        { label: 'Natija', patterns: [/\b(?:we will|we'll) (?:go|visit)\b/], hint: 'Natija uchun “we’ll go” yoki “we’ll visit” ishlating.' },
        { label: 'Manzil', patterns: [/\b(?:go to|visit) (?:the|a) museum\b/], hint: '“Go to the museum” yoki “visit the museum” mos keladi.' },
      ],
      mistakes: [{ pattern: /\bif it will rain\b/, note: 'Birinchi tur shart gapida “if” qismida “it rains” ishlatiladi.' }],
    },
  ],
  ielts: [
    {
      title: 'Writing Task 1 · Chart Snapshot',
      instruction: 'Jadvaldagi o‘zgarishni ingliz tilida 1–2 gap bilan ifodalang.',
      prompt: 'Students who cycle to school\n2018: 20%   →   2024: 35%',
      model: 'The proportion of students who cycled to school rose from 20% in 2018 to 35% in 2024, an increase of 15 percentage points.',
      criteria: [
        { label: 'Mavzu', patterns: [/\b(?:students|pupils)\b.*\bcycl(?:e|ed|ing)(?: to school)?\b/, /\bcycl(?:e|ed|ing)\b.*\b(?:students|pupils)\b/], hint: 'Ko‘rsatkich kimga va qanday qatnov turiga tegishli ekanini yozing.' },
        { label: 'O‘sish yo‘nalishi', patterns: [/\b(?:rose|increased|grew|climbed|went up|increase|rise|growth|higher)\b/], hint: 'O‘sishni “rose”, “increased” yoki boshqa mos so‘z bilan bildiring.' },
        { label: '2018-yil qiymati', patterns: [/\b20\s*(?:%|per cent\b|percent\b)\s*(?:in\s+|\(\s*)2018\b/, /\b2018(?:\s*:\s*|\s*,?\s+(?:it was|the figure was|the proportion was)\s+|[\s(]+)20\s*(?:%|per cent\b|percent\b)/], hint: '2018-yilga 20% ni aniq bog‘lang. Masalan, “20% in 2018”.' },
        { label: '2024-yil qiymati', patterns: [/\b35\s*(?:%|per cent\b|percent\b)\s*(?:in\s+|\(\s*)2024\b/, /\b2024(?:\s*:\s*|\s*,?\s+(?:it was|the figure was|the proportion was)\s+|[\s(]+)35\s*(?:%|per cent\b|percent\b)/], hint: '2024-yilga 35% ni aniq bog‘lang. Masalan, “35% in 2024”.' },
      ],
      mistakes: [
        { pattern: /\bby 15\s*(?:%|percent\b|per cent\b)/, note: '20% dan 35% gacha o‘zgarish 15 foiz punkt bo‘ladi. “15 percentage points” deb yozing.' },
        { pattern: /\b(?:fell|dropped|declined|decreased)\b/, note: 'Jadvalda ko‘rsatkich oshgan. O‘sishni ifodalovchi fe’lni tanlang.' },
      ],
    },
    {
      title: 'Writing Task 1 · Comparing Results',
      instruction: 'Ikkita guruh natijasini ingliz tilida 1–2 gap bilan solishtiring.',
      prompt: 'Students who chose online lessons\nGroup A: 45%   ·   Group B: 30%',
      model: 'The proportion of students who chose online lessons was higher in Group A (45%) than in Group B (30%). The difference was 15 percentage points.',
      criteria: [
        { label: 'Mavzu', patterns: [/\b(?:online|virtual) (?:lessons|classes|learning)\b/], hint: 'Haqqoniy taqqoslash uchun “online lessons” mavzusini tilga oling.' },
        { label: 'A guruhi qiymati', patterns: [/(?:group a(?:[\s(:]+|\s+(?:had|recorded|stood at)\s+)45\s*(?:%|per cent\b|percent\b)|45\s*(?:%|per cent\b|percent\b)\s+(?:of|for|in)\s+group a)/], hint: 'A guruhi uchun 45% qiymatini yozing.' },
        { label: 'B guruhi qiymati', patterns: [/(?:group b(?:[\s(:]+|\s+(?:had|recorded|stood at)\s+)30\s*(?:%|per cent\b|percent\b)|30\s*(?:%|per cent\b|percent\b)\s+(?:of|for|in)\s+group b)/], hint: 'B guruhi uchun 30% qiymatini yozing.' },
        { label: 'Taqqoslash', patterns: [/\b(?:higher|lower|greater|less|compared|difference|whereas|versus|while)\b/], hint: '“Higher than” yoki “whereas” orqali natijalarni solishtiring.' },
      ],
      mistakes: [{ pattern: /\b(?:difference|higher|lower)[^.!?]{0,10}15\s*(?:%|percent\b|per cent\b)/, note: '45% va 30% orasidagi tafovutni “15 percentage points” deb yozing.' }],
    },
    {
      title: 'Writing Task 2 · Opinion Paragraph',
      instruction: 'Inglizcha 2–4 gap yozing. Pozitsiyangizni bildiring, sabab keltiring va uni aniq misol bilan asoslang.',
      prompt: 'Some people think schools should give students less homework. To what extent do you agree or disagree?',
      model: 'I agree that schools should give students less homework because they need time to rest. For example, students who finish their assignments before dinner can read for pleasure or go outside. These activities can help them return to class with more energy.',
      criteria: [
        { label: 'Mavzu', patterns: [/\b(?:homework|assignments|schoolwork)\b/], hint: 'Javobni uy vazifasi mavzusiga bog‘lang.' },
        { label: 'Pozitsiya ifodasi', patterns: [/\b(?:i (?:agree|disagree|believe|think|support|oppose)|in my (?:view|opinion)|schools should)\b/], hint: 'Pozitsiyangizni “I agree that…” yoki “In my view…” kabi ifoda bilan oching.' },
        { label: 'Sabab ifodasi', patterns: [/\b(?:because|since|as a result of|one reason|this (?:is|would be) because)\b/], hint: 'Nega shunday o‘ylashingizni sabab bilan bog‘lang. Masalan, “because”.' },
        { label: 'Misolga o‘tish', patterns: [/\b(?:for example|for instance|such as|to illustrate)\b/], hint: 'Fikringizni aniq vaziyat bilan tushuntiring. Misolni “For example” bilan boshlashingiz mumkin.' },
      ],
      mistakes: [
        { pattern: /\bhomeworks\b/, note: '“Homework” sanalmaydigan ot. “Homework” yoki “assignments” ishlating.' },
        { pattern: /\bi (?:am|was) (?:agree|disagree)\b/, note: '“Agree” va “disagree” fe’l. “I agree” yoki “I disagree” deb yozing.' },
      ],
    },
  ],
};
