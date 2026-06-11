import React, { useState, useEffect } from 'react';
import { WordPair, Team } from '../types';
import { sound } from '../utils/audio';
import { standardCategories, getTeacherVocabulary, saveTeacherVocabulary } from '../utils/data';
import { Save, Plus, Trash2, Edit, AlertCircle, Sparkles, BookOpen, ToggleLeft, ToggleRight, Check } from 'lucide-react';

interface TeacherSettingsProps {
  teamLeft: Team;
  teamRight: Team;
  maxScore: number;
  useCustomVocabulary: boolean;
  onUpdateTeams: (left: Team, right: Team) => void;
  onUpdateMaxScore: (score: number) => void;
  onToggleCustomVocabulary: (val: boolean) => void;
  onClose: () => void;
}

export default function TeacherSettings({
  teamLeft,
  teamRight,
  maxScore,
  useCustomVocabulary,
  onUpdateTeams,
  onUpdateMaxScore,
  onToggleCustomVocabulary,
  onClose
}: TeacherSettingsProps) {
  // Local settings variables
  const [leftName, setLeftName] = useState(teamLeft.name);
  const [rightName, setRightName] = useState(teamRight.name);
  const [leftEmoji, setLeftEmoji] = useState(teamLeft.emoji);
  const [rightEmoji, setRightEmoji] = useState(teamRight.emoji);
  const [victoryScore, setVictoryScore] = useState(maxScore);

  // Custom vocabulary editors
  const [customWords, setCustomWords] = useState<WordPair[]>([]);
  const [newUz, setNewUz] = useState('');
  const [newEn, setNewEn] = useState('');
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  useEffect(() => {
    // Read from localStorage to reflect updates
    setCustomWords(getTeacherVocabulary());
  }, []);

  // Save general parameters
  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();

    onUpdateTeams(
      { ...teamLeft, name: leftName, emoji: leftEmoji },
      { ...teamRight, name: rightName, emoji: rightEmoji }
    );
    onUpdateMaxScore(victoryScore);

    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
      onClose();
    }, 1000);
  };

  // Vocabulary adder
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const uzWord = newUz.trim();
    const enWord = newEn.trim();
    if (!uzWord || !enWord) return;

    sound.playTap();
    const updated = [...customWords, { uz: uzWord, en: enWord }];
    setCustomWords(updated);
    saveTeacherVocabulary(updated);

    // Reset simple entry fields
    setNewUz('');
    setNewEn('');
  };

  // Remove word from custom list
  const deleteCustomWord = (index: number) => {
    sound.playTap();
    const updated = [...customWords];
    updated.splice(index, 1);
    setCustomWords(updated);
    saveTeacherVocabulary(updated);
  };

  // Quick preset team setups for lazy teachers
  const applyPresetTeams = (group: string) => {
    sound.playTap();
    if (group === 'it') {
      setLeftName('Cyber Tigers');
      setLeftEmoji('⚡');
      setRightName('Matrix Wolves');
      setRightEmoji('👾');
    } else if (group === 'fruit') {
      setLeftName('Golden Apples');
      setLeftEmoji('🍎');
      setRightName('Super Bananas');
      setRightEmoji('🍌');
    } else {
      setLeftName('Uzbegim');
      setLeftEmoji('👑');
      setRightName('Qalqon');
      setRightEmoji('🛡️');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in divide-y divide-slate-800">
        
        {/* Banner with controls info */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-950 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              O'qituvchi Boshqaruv Paneli
            </h3>
            <span className="text-xs text-slate-400">Jamoalar, lug'at so'zlarini sozlang va nazorat qiling</span>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-805 text-xs font-bold text-slate-400 hover:text-white rounded-xl active:scale-95 transition-all"
          >
            Yopish (Close)
          </button>
        </div>

        {/* Content Tabs area */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-800 p-6 gap-6">
          
          {/* Group 1: Setup Teams and Game Bounds */}
          <div className="space-y-5">
            <h4 className="text-sm font-extrabold uppercase text-amber-500 tracking-wider">1. Jamoalar va Qoidalar</h4>

            {/* Quick preset triggers */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block mb-2">Tezkor nomlar to'plami (Shablonlar):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => applyPresetTeams('it')}
                  className="py-1 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 font-bold"
                >
                  IT-Cyber Mode
                </button>
                <button
                  onClick={() => applyPresetTeams('fruit')}
                  className="py-1 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 font-bold"
                >
                  Chempion Mevalar
                </button>
                <button
                  onClick={() => applyPresetTeams('uzb')}
                  className="py-1 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 font-bold"
                >
                  Uzbek Generals
                </button>
              </div>
            </div>

            <form onSubmit={saveGeneralSettings} className="space-y-4">
              {/* Left Team inputs */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 block">JAMOALAR SOZLAMALARI:</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={leftEmoji}
                    onChange={(e) => setLeftEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-center font-bold text-white text-lg col-span-1"
                  />
                  <input
                    type="text"
                    value={leftName}
                    onChange={(e) => setLeftName(e.target.value)}
                    placeholder="A Jamoa Nomi"
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 font-semibold text-white text-sm col-span-3 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Right Team inputs */}
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={rightEmoji}
                    onChange={(e) => setLeftEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-center font-bold text-white text-lg col-span-1"
                  />
                  <input
                    type="text"
                    value={rightName}
                    onChange={(e) => setRightName(e.target.value)}
                    placeholder="B Jamoa Nomi"
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 font-semibold text-white text-sm col-span-3 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Max Score Adjuster */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <label className="text-[11px] font-black text-slate-400 block uppercase">VIKTORINA BALL CHEGARASI (MAX SCORE):</label>
                <div className="flex gap-2.5">
                  {[5, 10, 15, 20].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setVictoryScore(score)}
                      className={`flex-1 py-2 font-bold font-mono text-sm rounded-xl border transition-all ${
                        victoryScore === score
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-1.5 uppercase text-xs tracking-wider transition-all"
                id="btn_save_teacher_props"
              >
                <Check className="w-4 h-4" />
                Sozlamalarni Saqlash va Yopish
              </button>
            </form>
          </div>

          {/* Group 2: Word list Management and custom word pool adder */}
          <div className="pl-0 md:pl-6 space-y-4">
            <h4 className="text-sm font-extrabold uppercase text-cyan-400 tracking-wider flex items-center justify-between">
              <span>2. Lug'at Sozlamalari</span>
              
              {/* Toggle switch custom list versus standard preset */}
              <button
                onClick={() => { sound.playTap(); onToggleCustomVocabulary(!useCustomVocabulary); }}
                className="flex items-center gap-1 opacity-90 scale-95 hover:opacity-100 transition-all cursor-pointer"
              >
                {useCustomVocabulary ? (
                  <ToggleRight className="w-8 h-8 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </h4>

            {/* Custom status badge */}
            <div className={`p-2 rounded-xl text-center text-xs font-bold border ${
              useCustomVocabulary 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}>
              {useCustomVocabulary 
                ? 'MAVJUD REJIM: FAQAT KATTA SHAXSIY LUG\'AT RO\'YXATINGIZ' 
                : 'MAVJUD REJIM: STANDART TAYYOR IT SAVODXONLIGI & HAYVON DEBUTLARI'}
            </div>

            {/* Form to insert custom word translation */}
            <form onSubmit={handleAddWord} className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-850">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block select-none">Shaxsiy yangi so'z qo'shish:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newUz}
                  onChange={(e) => setNewUz(e.target.value)}
                  placeholder="Uzbekcha (Masalan: Olma)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  placeholder="English (Masalan: Apple)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold hover:text-white rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-500" />
                Ro'yxatga kiritish
              </button>
            </form>

            {/* Custom word list items list block */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/80 max-h-[170px] overflow-y-auto space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black px-1.5">
                <span>Shaxsiy so'zlar ro'yxati ({customWords.length})</span>
                <button
                  type="button" 
                  onClick={() => { if (confirm("Haqiqatan ham hamma shaxsiy so'zlarni o'chirmoqchimisiz?")) { setCustomWords([]); saveTeacherVocabulary([]); } }}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 lowercase"
                >
                  <Trash2 className="w-3 h-3" /> hammasini o'chirish
                </button>
              </div>

              {customWords.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-600 italic">
                  Hali hech qanday shaxsiy so'z qo'shilmagan. Yuqorida yozib to'ldiring.
                </div>
              ) : (
                customWords.slice().reverse().map((word, idx) => {
                  // real index matching original array
                  const originalIndex = customWords.length - 1 - idx;
                  return (
                    <div
                      key={`${word.en}-${originalIndex}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850 text-xs text-slate-300"
                    >
                      <span className="font-semibold uppercase text-[10px] tracking-wide text-cyan-400">{word.en}</span>
                      <span className="text-slate-500">→ {word.uz}</span>
                      <button
                        type="button"
                        onClick={() => deleteCustomWord(originalIndex)}
                        className="p-1 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
