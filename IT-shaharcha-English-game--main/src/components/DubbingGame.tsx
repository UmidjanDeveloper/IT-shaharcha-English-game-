import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, ChevronRight, ChevronLeft, Star, RotateCcw, Play, Film } from 'lucide-react';
import { sound } from '../utils/audio';

// ─── Types ──────────────────────────────────────────────────────────────────
interface SceneChar {
  name: string;
  avatar: string;
  side: 'left' | 'right';
  color: string;
}

interface SceneLine {
  charIdx: number;
  en: string;
  uz: string;
  emotion?: string;
}

interface Scene {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  difficulty: 'beginner' | 'elementary' | 'advanced';
  bgType: 'school' | 'market' | 'park' | 'office' | 'home' | 'space' | 'restaurant' | 'hospital';
  characters: SceneChar[];
  lines: SceneLine[];
}

type DubbingPhase = 'select' | 'watch' | 'dub' | 'result';
type LinePhase = 'ready' | 'listening' | 'recording' | 'scored';

// ─── Scenes Data ─────────────────────────────────────────────────────────────
const SCENES: Scene[] = [
  {
    id: 'school-day',
    title: "Maktabdagi Birinchi Kun",
    subtitle: "A New Beginning",
    genre: "🎓 Multfilm",
    difficulty: 'beginner',
    bgType: 'school',
    characters: [
      { name: 'Alex', avatar: '👦', side: 'left', color: '#3b82f6' },
      { name: 'Sofia', avatar: '👧', side: 'right', color: '#ec4899' },
    ],
    lines: [
      { charIdx: 0, en: "Hi! My name is Alex. What's your name?", uz: "Salom! Mening ismim Alex. Sizning ismingiz nima?", emotion: '😊' },
      { charIdx: 1, en: "Hello, Alex! I'm Sofia. Nice to meet you!", uz: "Salom, Alex! Men Sofiaman. Tanishganimdan xursandman!", emotion: '🤗' },
      { charIdx: 0, en: "Is this your first day at school?", uz: "Bu maktabdagi birinchi kuningizmi?", emotion: '🤔' },
      { charIdx: 1, en: "Yes! I'm a little nervous.", uz: "Ha! Men biroz hayajonlanayapman.", emotion: '😅' },
      { charIdx: 0, en: "Don't worry! I'll be your friend. Follow me!", uz: "Tashvishlanmang! Men sizning do'stingiz bo'laman. Mening orqamdan keling!", emotion: '😄' },
    ]
  },
  {
    id: 'market-day',
    title: "Do'konda Xarid",
    subtitle: "Shopping Day",
    genre: "🛒 Kundalik Hayot",
    difficulty: 'beginner',
    bgType: 'market',
    characters: [
      { name: 'Kamol', avatar: '🧑', side: 'left', color: '#f97316' },
      { name: 'Sotuvchi', avatar: '👨‍💼', side: 'right', color: '#10b981' },
    ],
    lines: [
      { charIdx: 0, en: "Excuse me, how much is this apple?", uz: "Kechirasiz, bu olma qancha?", emotion: '🍎' },
      { charIdx: 1, en: "It's two dollars per kilogram.", uz: "Bu bir kilogramm uchun ikki dollar.", emotion: '💰' },
      { charIdx: 0, en: "Can I have two kilograms, please?", uz: "Iltimos, ikki kilogramm bera olasizmi?", emotion: '🙏' },
      { charIdx: 1, en: "Of course! Anything else for you?", uz: "Albatta! Boshqa narsami?", emotion: '😊' },
      { charIdx: 0, en: "No, thank you. Here is the money.", uz: "Yo'q, rahmat. Mana pul.", emotion: '💵' },
      { charIdx: 1, en: "Thank you very much! Have a great day!", uz: "Juda ko'p rahmat! Yaxshi kun!", emotion: '😄' },
    ]
  },
  {
    id: 'park-friends',
    title: "Bog'da Do'stlar",
    subtitle: "Friends in the Park",
    genre: "🌳 Multfilm",
    difficulty: 'beginner',
    bgType: 'park',
    characters: [
      { name: 'Lena', avatar: '👩', side: 'left', color: '#a855f7' },
      { name: 'Mike', avatar: '👦', side: 'right', color: '#06b6d4' },
    ],
    lines: [
      { charIdx: 1, en: "Wow, what a beautiful day!", uz: "Voy, qanday ajoyib kun!", emotion: '☀️' },
      { charIdx: 0, en: "Yes! Do you want to play football?", uz: "Ha! Futbol o'ynamoqchimisiz?", emotion: '⚽' },
      { charIdx: 1, en: "I love football! But I don't have a ball.", uz: "Men futbolni yaxshi ko'raman! Lekin to'pim yo'q.", emotion: '😢' },
      { charIdx: 0, en: "No problem! I have one. Let's go!", uz: "Muammo emas! Menda bor. Ketdik!", emotion: '🎉' },
      { charIdx: 1, en: "You are the best friend ever!", uz: "Siz eng zo'r do'stsiz!", emotion: '🤝' },
    ]
  },
  {
    id: 'doctor-visit',
    title: "Doktorga Tashrif",
    subtitle: "At the Doctor",
    genre: "🏥 Animatsiya",
    difficulty: 'elementary',
    bgType: 'hospital',
    characters: [
      { name: 'Bemor', avatar: '🤒', side: 'left', color: '#94a3b8' },
      { name: 'Doktor', avatar: '👨‍⚕️', side: 'right', color: '#22c55e' },
    ],
    lines: [
      { charIdx: 0, en: "Good morning, doctor. I don't feel well.", uz: "Xayrli tong, doktor. Men o'zimni yaxshi his etmayapman.", emotion: '😷' },
      { charIdx: 1, en: "I'm sorry to hear that. What are your symptoms?", uz: "Bunga qayg'urdim. Sizda qanday alomatlar bor?", emotion: '🩺' },
      { charIdx: 0, en: "I have a headache and a sore throat.", uz: "Mening boshim og'riydi va tomoqim og'riydi.", emotion: '😣' },
      { charIdx: 1, en: "I see. How long have you been feeling like this?", uz: "Tushunarliq. Qachondan beri o'zingizni shunday his etayapsiz?", emotion: '🤔' },
      { charIdx: 0, en: "Since yesterday morning.", uz: "Kecha ertalabdan beri.", emotion: '📅' },
      { charIdx: 1, en: "Rest at home and drink plenty of water. You'll be fine!", uz: "Uyda dam oling va ko'p suv iching. Tez orada sog'ayasiz!", emotion: '💊' },
    ]
  },
  {
    id: 'restaurant-order',
    title: "Restoranda Buyurtma",
    subtitle: "Ordering Food",
    genre: "🍕 Kundalik Hayot",
    difficulty: 'elementary',
    bgType: 'restaurant',
    characters: [
      { name: 'Mehmon', avatar: '🧑‍🦱', side: 'left', color: '#f59e0b' },
      { name: 'Ofitsiant', avatar: '🧑‍🍳', side: 'right', color: '#8b5cf6' },
    ],
    lines: [
      { charIdx: 1, en: "Welcome! Are you ready to order?", uz: "Xush kelibsiz! Buyurtma berishga tayyormisiz?", emotion: '📋' },
      { charIdx: 0, en: "Yes, please. I'd like a pizza and a salad.", uz: "Ha, iltimos. Bir pizza va salat olmoqchiman.", emotion: '🍕' },
      { charIdx: 1, en: "Great choice! What would you like to drink?", uz: "Ajoyib tanlov! Nima ichmoqchisiz?", emotion: '🥤' },
      { charIdx: 0, en: "Can I have orange juice, please?", uz: "Apelsin sharbati bera olasizmi?", emotion: '🍊' },
      { charIdx: 1, en: "Of course! Your order will be ready in fifteen minutes.", uz: "Albatta! Buyurtmangiz o'n besh daqiqada tayyor bo'ladi.", emotion: '⏱️' },
      { charIdx: 0, en: "Thank you! It smells wonderful in here.", uz: "Rahmat! Bu yerda hidlar juda yoqimli.", emotion: '😋' },
    ]
  },
  {
    id: 'space-adventure',
    title: "Kosmik Sarguzasht",
    subtitle: "Space Adventure",
    genre: "🚀 Fantastika",
    difficulty: 'advanced',
    bgType: 'space',
    characters: [
      { name: 'Komandir', avatar: '👨‍🚀', side: 'left', color: '#06b6d4' },
      { name: 'Robot', avatar: '🤖', side: 'right', color: '#a855f7' },
    ],
    lines: [
      { charIdx: 0, en: "ROBOT-7, what's the status of our mission?", uz: "ROBOT-7, missiyamizning holati qanday?", emotion: '🛸' },
      { charIdx: 1, en: "Commander, we are approaching Planet X at high speed.", uz: "Komandir, biz Planet X ga yuqori tezlikda yaqinlashmoqdamiz.", emotion: '🌌' },
      { charIdx: 0, en: "Excellent! Prepare the landing system immediately.", uz: "Ajoyib! Qo'nish tizimini zudlik bilan tayyorlang.", emotion: '🎯' },
      { charIdx: 1, en: "Warning! I'm detecting unusual energy signals ahead.", uz: "Ogohlantirish! Oldinda g'ayrioddiy energiya signallari aniqlanmoqda.", emotion: '⚠️' },
      { charIdx: 0, en: "Don't panic. Stay focused. We've trained for this.", uz: "Vahimaga tushmang. Diqqatli bo'ling. Biz bunga tayyorlandik.", emotion: '💪' },
      { charIdx: 1, en: "Understood, Commander. Initiating landing sequence now!", uz: "Tushunarli, Komandir. Qo'nish ketma-ketligi boshlanmoqda!", emotion: '🚀' },
    ]
  },
  {
    id: 'home-evening',
    title: "Uyda Kechqurun",
    subtitle: "Evening at Home",
    genre: "🏠 Oilaviy Film",
    difficulty: 'elementary',
    bgType: 'home',
    characters: [
      { name: 'Ona', avatar: '👩', side: 'left', color: '#f43f5e' },
      { name: 'Farzand', avatar: '🧒', side: 'right', color: '#3b82f6' },
    ],
    lines: [
      { charIdx: 0, en: "Did you finish your homework today?", uz: "Bugun uy vazifangizni bajardingizmi?", emotion: '📚' },
      { charIdx: 1, en: "Yes, mom! I finished everything at school.", uz: "Ha, oyi! Hammasini maktabda bajardim.", emotion: '✅' },
      { charIdx: 0, en: "Well done! What did you learn today?", uz: "Barakalla! Bugun nima o'rgandingiz?", emotion: '🌟' },
      { charIdx: 1, en: "We learned about animals in English class. It was so fun!", uz: "Ingliz tili darsida hayvonlar haqida o'rgandik. Juda qiziq edi!", emotion: '🦁' },
      { charIdx: 0, en: "That's wonderful! Now come and have dinner.", uz: "Bu ajoyib! Endi keling va kechki ovqat yeylik.", emotion: '🍽️' },
      { charIdx: 1, en: "Coming, mom! Thank you for cooking!", uz: "Ketdim, oyi! Ovqat tayyorlaganingiz uchun rahmat!", emotion: '❤️' },
    ]
  },
  {
    id: 'office-meeting',
    title: "Ish Uchrashuvida",
    subtitle: "Business Meeting",
    genre: "💼 Drama",
    difficulty: 'advanced',
    bgType: 'office',
    characters: [
      { name: 'Boss', avatar: '👔', side: 'left', color: '#1d4ed8' },
      { name: 'Xodim', avatar: '💻', side: 'right', color: '#0891b2' },
    ],
    lines: [
      { charIdx: 0, en: "Good morning. Please take a seat. We need to discuss the project.", uz: "Xayrli tong. Iltimos, o'tiring. Loyiha haqida gaplashishimiz kerak.", emotion: '📊' },
      { charIdx: 1, en: "Good morning, sir. I have prepared the full report.", uz: "Xayrli tong, janob. Men to'liq hisobotni tayyorladim.", emotion: '📄' },
      { charIdx: 0, en: "Excellent. The deadline is this Friday. Can you meet it?", uz: "Ajoyib. Muddati shu juma. Ulgurasizmi?", emotion: '📅' },
      { charIdx: 1, en: "Yes, sir. The team is working hard and we are on schedule.", uz: "Ha, janob. Jamoa qattiq ishlayapti va biz jadvalda turibmiz.", emotion: '⚙️' },
      { charIdx: 0, en: "Perfect. I believe in your team. Keep up the great work.", uz: "Mukammal. Men jamoangizga ishonaman. Yaxshi ishni davom eting.", emotion: '👍' },
    ]
  },
];

// ─── SVG Scene Backgrounds ───────────────────────────────────────────────────
function SceneBackground({ type, talking }: { type: Scene['bgType']; talking: 'left'|'right'|null }) {
  const base = "w-full h-full absolute inset-0";
  if (type === 'school') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#dbeafe"/>
      <rect x="0" y="100" width="400" height="120" fill="#b45309" opacity="0.15"/>
      <rect x="0" y="160" width="400" height="60" fill="#92400e" opacity="0.2"/>
      {/* Floor */}
      <rect x="0" y="170" width="400" height="50" fill="#d97706" opacity="0.15"/>
      {/* Chalkboard */}
      <rect x="120" y="20" width="160" height="90" rx="4" fill="#065f46"/>
      <rect x="124" y="24" width="152" height="82" rx="2" fill="#064e3b"/>
      <text x="200" y="68" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="monospace">Hello World!</text>
      <line x1="135" y1="80" x2="265" y2="80" stroke="#6ee7b7" strokeWidth="0.5" opacity="0.5"/>
      {/* Windows */}
      <rect x="10" y="30" width="60" height="70" rx="3" fill="#bae6fd"/>
      <line x1="40" y1="30" x2="40" y2="100" stroke="#7dd3fc" strokeWidth="1"/>
      <line x1="10" y1="65" x2="70" y2="65" stroke="#7dd3fc" strokeWidth="1"/>
      <rect x="330" y="30" width="60" height="70" rx="3" fill="#bae6fd"/>
      <line x1="360" y1="30" x2="360" y2="100" stroke="#7dd3fc" strokeWidth="1"/>
      <line x1="330" y1="65" x2="390" y2="65" stroke="#7dd3fc" strokeWidth="1"/>
      {/* Desks */}
      <rect x="50" y="140" width="80" height="8" rx="2" fill="#92400e" opacity="0.6"/>
      <rect x="270" y="140" width="80" height="8" rx="2" fill="#92400e" opacity="0.6"/>
    </svg>
  );
  if (type === 'market') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#fef9c3"/>
      <rect x="0" y="120" width="400" height="100" fill="#78350f" opacity="0.1"/>
      {/* Shelves */}
      <rect x="150" y="40" width="100" height="6" rx="2" fill="#a16207"/>
      <rect x="150" y="80" width="100" height="6" rx="2" fill="#a16207"/>
      <rect x="150" y="120" width="100" height="6" rx="2" fill="#a16207"/>
      {/* Fruits on shelves */}
      {['🍎','🍊','🍋','🍇','🍓'].map((f,i) => (
        <text key={i} x={157+i*18} y={72} fontSize="14">{f}</text>
      ))}
      {['🥕','🥦','🌽','🍆','🥬'].map((f,i) => (
        <text key={i} x={157+i*18} y={112} fontSize="14">{f}</text>
      ))}
      {/* Counter */}
      <rect x="130" y="155" width="140" height="30" rx="4" fill="#d97706" opacity="0.7"/>
      <rect x="130" y="150" width="140" height="8" rx="2" fill="#b45309"/>
      {/* Price tags */}
      <rect x="155" y="38" width="30" height="14" rx="2" fill="#fde047" opacity="0.8"/>
      <text x="170" y="49" textAnchor="middle" fill="#78350f" fontSize="7">$2/kg</text>
      {/* Awning */}
      <path d="M80 0 L320 0 L300 35 L100 35 Z" fill="#ef4444" opacity="0.7"/>
      <path d="M80 0 L100 35" stroke="#dc2626" strokeWidth="2"/>
      <path d="M140 0 L150 35" stroke="#dc2626" strokeWidth="2"/>
      <path d="M200 0 L200 35" stroke="#dc2626" strokeWidth="2"/>
      <path d="M260 0 L250 35" stroke="#dc2626" strokeWidth="2"/>
      <path d="M320 0 L300 35" stroke="#dc2626" strokeWidth="2"/>
    </svg>
  );
  if (type === 'park') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#7dd3fc"/>
      <rect x="0" y="140" width="400" height="80" fill="#4ade80"/>
      <rect x="0" y="155" width="400" height="65" fill="#22c55e"/>
      {/* Sun */}
      <circle cx="340" cy="35" r="22" fill="#fbbf24"/>
      {[0,45,90,135,180,225,270,315].map((a,i) => (
        <line key={i} x1={340+22*Math.cos(a*Math.PI/180)} y1={35+22*Math.sin(a*Math.PI/180)} x2={340+32*Math.cos(a*Math.PI/180)} y2={35+32*Math.sin(a*Math.PI/180)} stroke="#fbbf24" strokeWidth="2"/>
      ))}
      {/* Clouds */}
      <ellipse cx="80" cy="30" rx="35" ry="15" fill="white" opacity="0.9"/>
      <ellipse cx="100" cy="25" rx="25" ry="15" fill="white" opacity="0.9"/>
      <ellipse cx="60" cy="28" rx="20" ry="12" fill="white" opacity="0.9"/>
      <ellipse cx="230" cy="50" rx="30" ry="12" fill="white" opacity="0.8"/>
      {/* Trees */}
      <rect x="55" y="100" width="10" height="50" rx="2" fill="#92400e"/>
      <ellipse cx="60" cy="90" rx="28" ry="25" fill="#16a34a"/>
      <ellipse cx="50" cy="98" rx="20" ry="18" fill="#15803d"/>
      <rect x="330" y="110" width="10" height="40" rx="2" fill="#92400e"/>
      <ellipse cx="335" cy="100" rx="25" ry="22" fill="#16a34a"/>
      {/* Path */}
      <ellipse cx="200" cy="200" rx="80" ry="20" fill="#d97706" opacity="0.3"/>
      {/* Bench */}
      <rect x="170" y="148" width="60" height="5" rx="2" fill="#92400e"/>
      <rect x="175" y="153" width="5" height="12" rx="1" fill="#92400e"/>
      <rect x="220" y="153" width="5" height="12" rx="1" fill="#92400e"/>
    </svg>
  );
  if (type === 'hospital') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#f0fdf4"/>
      <rect x="0" y="155" width="400" height="65" fill="#e2e8f0"/>
      {/* Examination table */}
      <rect x="130" y="130" width="140" height="30" rx="4" fill="#cbd5e1"/>
      <rect x="140" y="125" width="120" height="8" rx="3" fill="#94a3b8"/>
      {/* Medical cross */}
      <rect x="185" y="30" width="30" height="80" rx="4" fill="#bbf7d0"/>
      <rect x="160" y="55" width="80" height="30" rx="4" fill="#bbf7d0"/>
      <rect x="185" y="30" width="30" height="80" rx="3" fill="#4ade80" opacity="0.5"/>
      <rect x="160" y="55" width="80" height="30" rx="3" fill="#4ade80" opacity="0.5"/>
      {/* Windows */}
      <rect x="20" y="40" width="70" height="60" rx="3" fill="#bfdbfe"/>
      <line x1="55" y1="40" x2="55" y2="100" stroke="#93c5fd" strokeWidth="1.5"/>
      <line x1="20" y1="70" x2="90" y2="70" stroke="#93c5fd" strokeWidth="1.5"/>
      <rect x="310" y="40" width="70" height="60" rx="3" fill="#bfdbfe"/>
      <line x1="345" y1="40" x2="345" y2="100" stroke="#93c5fd" strokeWidth="1.5"/>
      <line x1="310" y1="70" x2="380" y2="70" stroke="#93c5fd" strokeWidth="1.5"/>
    </svg>
  );
  if (type === 'restaurant') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#fff7ed"/>
      <rect x="0" y="155" width="400" height="65" fill="#fdba74" opacity="0.3"/>
      {/* Tables */}
      <ellipse cx="200" cy="155" rx="55" ry="15" fill="#d97706" opacity="0.5"/>
      <rect x="196" y="155" width="8" height="30" rx="2" fill="#92400e"/>
      {/* Plates */}
      <circle cx="180" cy="148" r="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
      <circle cx="220" cy="148" r="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
      {/* Candle */}
      <rect x="198" y="128" width="4" height="15" rx="1" fill="#fbbf24"/>
      <ellipse cx="200" cy="126" rx="5" ry="7" fill="#fde68a" opacity="0.8"/>
      {/* Menu board */}
      <rect x="150" y="20" width="100" height="80" rx="4" fill="#7c2d12"/>
      <text x="200" y="45" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="bold">MENU</text>
      <text x="200" y="60" textAnchor="middle" fill="#fed7aa" fontSize="7">🍕 Pizza $12</text>
      <text x="200" y="73" textAnchor="middle" fill="#fed7aa" fontSize="7">🥗 Salad $8</text>
      <text x="200" y="86" textAnchor="middle" fill="#fed7aa" fontSize="7">🍰 Cake $6</text>
      {/* Fairy lights */}
      {Array.from({length:10}).map((_,i)=>(
        <circle key={i} cx={20+i*40} cy={15} r={3} fill={['#fbbf24','#f87171','#34d399','#60a5fa'][i%4]}/>
      ))}
      <line x1="0" y1="15" x2="400" y2="15" stroke="#d1d5db" strokeWidth="0.5"/>
    </svg>
  );
  if (type === 'space') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#0f0a1e"/>
      {/* Stars */}
      {Array.from({length:40}).map((_,i)=>(
        <circle key={i} cx={Math.sin(i*137.5)*180+200} cy={Math.cos(i*97.3)*90+110} r={Math.random()<0.3?1.5:0.8} fill="white" opacity={0.5+Math.random()*0.5}/>
      ))}
      {/* Planet */}
      <circle cx="300" cy="60" r="45" fill="#7c3aed"/>
      <ellipse cx="300" cy="60" rx="65" ry="12" fill="none" stroke="#a78bfa" strokeWidth="3" opacity="0.6"/>
      <circle cx="300" cy="50" r="12" fill="#5b21b6" opacity="0.6"/>
      {/* Spaceship */}
      <ellipse cx="120" cy="100" rx="40" ry="18" fill="#1e3a5f"/>
      <ellipse cx="120" cy="96" rx="25" ry="14" fill="#3b82f6" opacity="0.7"/>
      <ellipse cx="120" cy="118" rx="15" ry="5" fill="#93c5fd" opacity="0.4"/>
      {[0,1,2].map(i=>(
        <circle key={i} cx={107+i*13} cy={120} r={3} fill={['#fbbf24','#f87171','#34d399'][i]}/>
      ))}
      {/* Nebula */}
      <ellipse cx="50" cy="60" rx="40" ry="25" fill="#7c3aed" opacity="0.15"/>
      <ellipse cx="370" cy="170" rx="35" ry="20" fill="#0ea5e9" opacity="0.1"/>
      {/* Astronaut helmet detail */}
      <rect x="0" y="155" width="400" height="65" fill="#0f0a1e"/>
      <rect x="0" y="155" width="400" height="8" fill="#1e3a5f"/>
    </svg>
  );
  if (type === 'home') return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#fef3c7"/>
      <rect x="0" y="145" width="400" height="75" fill="#d97706" opacity="0.15"/>
      {/* Wall art */}
      <rect x="130" y="30" width="140" height="100" rx="4" fill="#1e293b" opacity="0.05"/>
      {/* Sofa */}
      <rect x="100" y="145" width="200" height="40" rx="8" fill="#7c3aed" opacity="0.5"/>
      <rect x="100" y="138" width="200" height="15" rx="4" fill="#6d28d9" opacity="0.5"/>
      <rect x="100" y="145" width="20" height="40" rx="4" fill="#5b21b6" opacity="0.4"/>
      <rect x="280" y="145" width="20" height="40" rx="4" fill="#5b21b6" opacity="0.4"/>
      {/* Cushions */}
      <rect x="130" y="140" width="50" height="20" rx="6" fill="#a78bfa" opacity="0.7"/>
      <rect x="220" y="140" width="50" height="20" rx="6" fill="#a78bfa" opacity="0.7"/>
      {/* Window */}
      <rect x="20" y="30" width="80" height="80" rx="3" fill="#bae6fd"/>
      <line x1="60" y1="30" x2="60" y2="110" stroke="#7dd3fc" strokeWidth="2"/>
      <line x1="20" y1="70" x2="100" y2="70" stroke="#7dd3fc" strokeWidth="2"/>
      {/* Curtains */}
      <path d="M20 30 Q35 60 25 110 L20 110 Z" fill="#fb923c" opacity="0.5"/>
      <path d="M100 30 Q85 60 95 110 L100 110 Z" fill="#fb923c" opacity="0.5"/>
      {/* Bookshelf */}
      <rect x="310" y="40" width="70" height="100" rx="3" fill="#92400e" opacity="0.3"/>
      {[0,1,2,3].map(i=>(
        <rect key={i} x="315" y={48+i*24} width="60" height="18" rx="2" fill={['#ef4444','#3b82f6','#22c55e','#f59e0b'][i]} opacity="0.6"/>
      ))}
      {/* Lamp */}
      <rect x="285" y="105" width="8" height="50" rx="2" fill="#92400e" opacity="0.5"/>
      <path d="M270 105 L315 105 L300 80 Z" fill="#fbbf24" opacity="0.4"/>
    </svg>
  );
  // office fallback
  return (
    <svg viewBox="0 0 400 220" className={base} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#f1f5f9"/>
      <rect x="0" y="150" width="400" height="70" fill="#e2e8f0"/>
      <rect x="120" y="120" width="160" height="15" rx="3" fill="#94a3b8"/>
      <rect x="100" y="135" width="200" height="40" rx="4" fill="#cbd5e1"/>
      <rect x="20" y="20" width="80" height="100" rx="3" fill="#bfdbfe" opacity="0.5"/>
      <rect x="300" y="20" width="80" height="100" rx="3" fill="#bfdbfe" opacity="0.5"/>
      <rect x="150" y="30" width="100" height="70" rx="3" fill="#1e3a5f" opacity="0.3"/>
      <text x="200" y="70" textAnchor="middle" fill="#93c5fd" fontSize="10">📊</text>
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}

type WM = { word: string; match: 'exact'|'close'|'miss' };

function compareText(target: string, spoken: string): WM[] {
  const clean = (s:string) => s.toLowerCase().replace(/[^a-z\s']/g,'').trim();
  const tw = clean(target).split(/\s+/).filter(Boolean);
  const sw = clean(spoken).split(/\s+/).filter(Boolean);
  return tw.map(t => sw.some(s=>s===t) ? {word:t,match:'exact'as const}
    : sw.some(s=>levenshtein(t,s)<=1) ? {word:t,match:'close'as const}
    : {word:t,match:'miss'as const});
}

function calcScore(m: WM[]): number {
  if(!m.length) return 0;
  return Math.round(m.reduce((a,x)=>a+(x.match==='exact'?2:x.match==='close'?1:0),0)/(m.length*2)*100);
}

function playTTS(text: string, rate=0.82) {
  window.speechSynthesis?.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang='en-US'; u.rate=rate;
  window.speechSynthesis?.speak(u);
}

const DIFF_COLOR = { beginner:'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', elementary:'text-amber-400 border-amber-500/30 bg-amber-500/10', advanced:'text-rose-400 border-rose-500/30 bg-rose-500/10' };

// ─── Component ───────────────────────────────────────────────────────────────
interface DubbingGameProps { onBack: () => void; }

export default function DubbingGame({ onBack }: DubbingGameProps) {
  const [phase, setPhase] = useState<DubbingPhase>('select');
  const [scene, setScene] = useState<Scene | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [linePhase, setLinePhase] = useState<LinePhase>('ready');
  const [spokenText, setSpokenText] = useState('');
  const [matches, setMatches] = useState<WM[]>([]);
  const [lineScore, setLineScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [lineScores, setLineScores] = useState<number[]>([]);
  const [talkingSide, setTalkingSide] = useState<'left'|'right'|null>(null);

  const recRef = useRef<SpeechRecognition|null>(null);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const stopRec = useCallback(() => {
    if(timerRef.current) clearTimeout(timerRef.current);
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
  }, []);

  useEffect(() => () => { stopRec(); window.speechSynthesis?.cancel(); }, []);

  const currentLine = scene ? scene.lines[lineIdx] : null;
  const currentChar = scene && currentLine ? scene.characters[currentLine.charIdx] : null;

  const listenLine = useCallback(() => {
    if(!currentLine) return;
    setLinePhase('listening');
    setTalkingSide(currentChar?.side ?? null);
    playTTS(currentLine.en);
    const dur = Math.max(2000, currentLine.en.length * 70);
    setTimeout(() => { setLinePhase('ready'); setTalkingSide(null); }, dur);
  }, [currentLine, currentChar]);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) { finishRec(''); return; }
    setLinePhase('recording');
    setTalkingSide(currentChar?.side ?? null);
    window.speechSynthesis?.cancel();
    const r = new SR();
    r.lang='en-US'; r.continuous=false; r.interimResults=false;
    recRef.current = r;
    r.onresult = (e:SpeechRecognitionEvent) => finishRec(e.results[0]?.[0]?.transcript||'');
    r.onerror = () => finishRec('');
    r.onend = () => { if(linePhase==='recording') finishRec(''); };
    try { r.start(); } catch { finishRec(''); return; }
    timerRef.current = setTimeout(() => { try{ r.stop(); }catch{} }, 7000);
  }, [currentLine, currentChar, linePhase]);

  const finishRec = useCallback((transcript: string) => {
    stopRec();
    setTalkingSide(null);
    if(!currentLine) return;
    const m = compareText(currentLine.en, transcript);
    const s = calcScore(m);
    setSpokenText(transcript);
    setMatches(m);
    setLineScore(s);
    setLineScores(prev => { const n=[...prev]; n[lineIdx]=s; return n; });
    setTotalScore(prev => prev + s);
    setLinePhase('scored');
    if(s>=85) sound.playCorrect();
    else if(s>=50) sound.playTap();
    else sound.playIncorrect();
  }, [currentLine, lineIdx, stopRec]);

  const nextLine = useCallback(() => {
    if(!scene) return;
    if(lineIdx < scene.lines.length - 1) {
      setLineIdx(i => i+1);
      setLinePhase('ready');
      setSpokenText('');
      setMatches([]);
      setTalkingSide(null);
    } else {
      setPhase('result');
    }
  }, [scene, lineIdx]);

  const startScene = (s: Scene) => {
    setScene(s);
    setLineIdx(0);
    setLinePhase('ready');
    setSpokenText('');
    setMatches([]);
    setTotalScore(0);
    setLineScores([]);
    setTalkingSide(null);
    setPhase('watch');
    sound.playTap();
  };

  const restartScene = () => {
    if(!scene) return;
    startScene(scene);
  };

  const avgScore = scene && lineScores.length
    ? Math.round(lineScores.filter(Boolean).reduce((a,b)=>a+b,0) / lineScores.filter(Boolean).length)
    : 0;

  // ── Scene selection ──
  if(phase === 'select') return (
    <div className="max-w-4xl mx-auto px-4 py-6 select-none animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4"/> O'yinlarga
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">🎬 DUBLYAJ STUDIO</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Kino va multiklarga o'z ovozingizni bering</p>
        </div>
        <div className="w-24"/>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENES.map(s => (
          <button key={s.id} onClick={() => startScene(s)}
            className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden transition-all active:scale-98 cursor-pointer shadow-xl hover:shadow-indigo-500/10 text-left">
            {/* Mini scene preview */}
            <div className="relative h-32 overflow-hidden">
              <SceneBackground type={s.bgType} talking={null}/>
              {/* Characters preview */}
              <div className="absolute bottom-3 left-4 text-3xl"
                style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
                {s.characters[0].avatar}
              </div>
              <div className="absolute bottom-3 right-4 text-3xl"
                style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
                {s.characters[s.characters.length-1].avatar}
              </div>
              {/* Genre badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg text-[9px] font-black text-white">
                {s.genre}
              </div>
              {/* Line count */}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg text-[9px] font-black text-slate-300">
                {s.lines.length} gap
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <h3 className="font-black text-white text-sm group-hover:text-indigo-300 transition-colors">{s.title}</h3>
              <p className="text-[10px] text-slate-400 italic">"{s.subtitle}"</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2 text-[10px]">
                  {s.characters.map((c,i) => (
                    <span key={i} style={{color:c.color}} className="font-bold">{c.avatar} {c.name}</span>
                  ))}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${DIFF_COLOR[s.difficulty]}`}>
                  {s.difficulty}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Result screen ──
  if(phase === 'result' && scene) {
    const stars = avgScore >= 90 ? 3 : avgScore >= 65 ? 2 : avgScore >= 35 ? 1 : 0;
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center select-none animate-fade-in">
        <Film className="w-12 h-12 text-indigo-400 mx-auto mb-4"/>
        <h2 className="text-2xl font-black text-white uppercase">Dublyaj Tugadi!</h2>
        <p className="text-slate-400 text-sm mt-1">"{scene.title}"</p>

        <div className="mt-6 flex justify-center gap-2">
          {[1,2,3].map(s=>(
            <Star key={s} className={`w-10 h-10 ${s<=stars?'text-amber-400 fill-amber-400':'text-slate-700'}`}/>
          ))}
        </div>
        <p className={`text-5xl font-black mt-4 ${avgScore>=80?'text-emerald-400':avgScore>=50?'text-amber-400':'text-rose-400'}`}>{avgScore}%</p>
        <p className="text-slate-400 text-xs mt-1">O'rtacha aniqlik</p>

        {/* Per-line scores */}
        <div className="mt-6 space-y-2">
          {scene.lines.map((l,i) => {
            const ch = scene.characters[l.charIdx];
            const sc = lineScores[i] ?? 0;
            return (
              <div key={i} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-left">
                <span className="text-xl flex-shrink-0">{ch.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">{l.en}</p>
                  <div className="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${sc>=80?'bg-emerald-500':sc>=50?'bg-amber-500':'bg-rose-500'}`} style={{width:`${sc}%`}}/>
                  </div>
                </div>
                <span className={`text-xs font-black flex-shrink-0 ${sc>=80?'text-emerald-400':sc>=50?'text-amber-400':'text-rose-400'}`}>{sc}%</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={restartScene} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-black text-xs uppercase rounded-2xl cursor-pointer transition-all">
            <RotateCcw className="w-4 h-4"/> Qayta
          </button>
          <button onClick={() => setPhase('select')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase rounded-2xl cursor-pointer transition-all">
            <Film className="w-4 h-4"/> Boshqa sahna
          </button>
        </div>
        <button onClick={onBack} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-all cursor-pointer">
          O'yinlarga qaytish
        </button>
      </div>
    );
  }

  // ── Dubbing screen ──
  if(!scene || !currentLine || !currentChar) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 select-none animate-fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { stopRec(); window.speechSynthesis?.cancel(); setPhase('select'); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-all">
          <ArrowLeft className="w-3.5 h-3.5"/> Sahnalar
        </button>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black">{scene.title}</p>
          <p className="text-xs text-slate-300 font-bold">Gap {lineIdx+1} / {scene.lines.length}</p>
        </div>
        <div className="text-right">
          {lineScores.filter(Boolean).length > 0 && (
            <>
              <p className="text-[9px] text-slate-500 uppercase">Ball</p>
              <p className="text-sm font-black text-indigo-400">
                {Math.round(lineScores.filter(Boolean).reduce((a,b)=>a+b,0)/lineScores.filter(Boolean).length)}%
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width:`${((lineIdx+1)/scene.lines.length)*100}%` }}/>
      </div>

      {/* ── Cinema frame ── */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
        {/* Black cinema bars */}
        <div className="h-5 bg-black w-full"/>
        {/* Scene */}
        <div className="relative h-44">
          <SceneBackground type={scene.bgType} talking={talkingSide}/>

          {/* Characters */}
          {scene.characters.map((ch, i) => {
            const isActive = scene.lines[lineIdx].charIdx === i;
            const isTalking = talkingSide === ch.side;
            return (
              <div key={i} className={`absolute bottom-3 transition-all duration-300 ${
                ch.side === 'left' ? 'left-6' : 'right-6'
              } ${isActive ? 'scale-110' : 'scale-100 opacity-60'}`}>
                <div className={`relative text-5xl ${isTalking ? 'animate-bounce' : ''}`}
                  style={{filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'}}>
                  {ch.avatar}
                  {/* Speech bubble when talking */}
                  {isTalking && (
                    <div className={`absolute ${ch.side==='left'?'left-full ml-2':'right-full mr-2'} -top-2 bg-white rounded-2xl px-3 py-2 shadow-xl min-w-[120px] max-w-[180px] z-10`}
                      style={{borderBottomLeftRadius: ch.side==='left'?'4px':'16px', borderBottomRightRadius: ch.side==='right'?'4px':'16px'}}>
                      <p className="text-slate-900 text-[9px] font-bold leading-tight">{currentLine.en}</p>
                      <div className={`absolute bottom-2 ${ch.side==='left'?'-left-2':'right-[-8px]'} w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${ch.side==='left'?'border-r-[8px] border-r-white':'border-l-[8px] border-l-white'}`}/>
                    </div>
                  )}
                  {/* Score badge */}
                  {lineScores[lineIdx] !== undefined && isActive && linePhase === 'scored' && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black px-2 py-0.5 rounded-full border ${
                      lineScores[lineIdx]>=80?'bg-emerald-500/20 border-emerald-500 text-emerald-400':
                      lineScores[lineIdx]>=50?'bg-amber-500/20 border-amber-500 text-amber-400':
                      'bg-rose-500/20 border-rose-500 text-rose-400'
                    }`}>{lineScores[lineIdx]}%</div>
                  )}
                </div>
                <p className="text-center text-[9px] font-black mt-1 drop-shadow-lg" style={{color:ch.color, textShadow:'0 1px 4px rgba(0,0,0,0.8)'}}>{ch.name}</p>
              </div>
            );
          })}

          {/* Recording waveform overlay */}
          {linePhase === 'recording' && (
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 h-10 bg-gradient-to-t from-black/40">
              {Array.from({length:28}).map((_,i)=>(
                <div key={i} className="w-1 bg-rose-500 rounded-full animate-pulse opacity-80"
                  style={{height:`${10+Math.abs(Math.sin(i*0.6))*20}px`, animationDelay:`${i*0.04}s`}}/>
              ))}
            </div>
          )}
          {/* Listening animation */}
          {linePhase === 'listening' && (
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 h-10 bg-gradient-to-t from-black/40">
              {Array.from({length:28}).map((_,i)=>(
                <div key={i} className="w-1 bg-cyan-500 rounded-full animate-bounce opacity-70"
                  style={{height:`${8+Math.abs(Math.sin(i*0.5))*16}px`, animationDelay:`${i*0.05}s`}}/>
              ))}
            </div>
          )}
        </div>
        {/* Bottom black bar */}
        <div className="h-5 bg-black w-full"/>
      </div>

      {/* ── Dialogue box ── */}
      <div className={`mt-4 rounded-2xl border p-4 space-y-3 transition-all duration-300 ${
        linePhase === 'recording' ? 'border-rose-500/50 bg-rose-950/20' :
        linePhase === 'listening' ? 'border-cyan-500/40 bg-cyan-950/20' :
        linePhase === 'scored' && lineScore >= 80 ? 'border-emerald-500/40 bg-emerald-950/20' :
        linePhase === 'scored' ? 'border-amber-500/30 bg-slate-900/60' :
        'border-slate-800 bg-slate-900/60'
      }`}>
        {/* Speaker badge */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentChar.avatar}</span>
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black">Gapirayotgan:</p>
            <p className="text-sm font-black" style={{color:currentChar.color}}>{currentChar.name}</p>
          </div>
          {currentLine.emotion && <span className="ml-auto text-xl">{currentLine.emotion}</span>}
        </div>

        {/* Dialogue text — colored in scored phase */}
        {linePhase === 'scored' && matches.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {matches.map((m,i) => (
              <span key={i} className={`text-sm font-black px-2 py-0.5 rounded-lg border ${
                m.match==='exact'?'text-emerald-400 border-emerald-500/30 bg-emerald-500/10':
                m.match==='close'?'text-amber-400 border-amber-500/30 bg-amber-500/10':
                'text-rose-400 border-rose-500/30 bg-rose-500/10'
              }`}>{m.word}</span>
            ))}
          </div>
        ) : (
          <p className={`text-base font-black leading-relaxed ${
            linePhase==='listening'?'text-cyan-300':linePhase==='recording'?'text-rose-300':'text-white'
          }`}>{currentLine.en}</p>
        )}
        <p className="text-xs text-slate-400 italic">{currentLine.uz}</p>

        {/* Heard text */}
        {spokenText && linePhase === 'scored' && (
          <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black mb-0.5">Eshitildi:</p>
            <p className="text-xs text-slate-300 italic">"{spokenText}"</p>
          </div>
        )}

        {/* Score row */}
        {linePhase === 'scored' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-[9px] font-bold uppercase">
                <span className="text-emerald-400">✅ To'g'ri</span>
                <span className="text-amber-400">〰️ Yaqin</span>
                <span className="text-rose-400">❌ Xato</span>
              </div>
              <span className={`text-lg font-black ${lineScore>=80?'text-emerald-400':lineScore>=50?'text-amber-400':'text-rose-400'}`}>{lineScore}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${lineScore>=80?'bg-gradient-to-r from-emerald-500 to-cyan-500':lineScore>=50?'bg-amber-500':'bg-rose-500'}`} style={{width:`${lineScore}%`}}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="mt-4 flex gap-2">
        {/* Listen */}
        <button onClick={listenLine} disabled={linePhase === 'recording'}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
            linePhase==='listening'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
          }`}>
          <Volume2 className="w-3.5 h-3.5"/>
          {linePhase==='listening' ? 'Aytilmoqda...' : 'Eshit'}
        </button>

        {/* Record */}
        <button onClick={linePhase==='recording' ? () => finishRec('') : startRec}
          disabled={linePhase==='listening'}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
            linePhase==='recording'
              ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500'
          }`}>
          {linePhase==='recording' ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
          {linePhase==='recording' ? 'To\'xtatish ■' : '🎤 Ovoz bering'}
        </button>

        {/* Next */}
        {linePhase === 'scored' && (
          <button onClick={nextLine}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400 font-black text-xs uppercase transition-all cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/20">
            {lineIdx < scene.lines.length - 1 ? <><ChevronRight className="w-4 h-4"/> Keyingi</> : <><Play className="w-4 h-4"/> Natija</>}
          </button>
        )}
        {linePhase === 'ready' && (
          <button onClick={nextLine} disabled={lineIdx >= scene.lines.length - 1}
            className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-400 hover:border-slate-500 font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-30">
            <ChevronRight className="w-4 h-4"/> O'tkazib yuborish
          </button>
        )}
      </div>

      {/* Line dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {scene.lines.map((_,i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i === lineIdx ? 'w-6 bg-indigo-500' :
            lineScores[i] !== undefined ? (lineScores[i]>=80?'w-3 bg-emerald-500':lineScores[i]>=50?'w-3 bg-amber-500':'w-3 bg-rose-500') :
            'w-3 bg-slate-700'
          }`}/>
        ))}
      </div>
    </div>
  );
}
