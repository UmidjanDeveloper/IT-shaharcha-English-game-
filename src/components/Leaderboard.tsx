import React, { useEffect, useState } from 'react';
import { Team } from '../types';
import { sound } from '../utils/audio';
import { Trophy, Award, RefreshCw, Home, Sparkles, Share2, Printer, Camera } from 'lucide-react';

interface LeaderboardProps {
  winner: Team;
  leftTeam: Team;
  rightTeam: Team;
  onRematch: () => void;
  onHome: () => void;
}

export default function Leaderboard({
  winner,
  leftTeam,
  rightTeam,
  onRematch,
  onHome
}: LeaderboardProps) {
  const [showCertificate, setShowCertificate] = useState(false);
  const [stampActive, setStampActive] = useState(false);

  useEffect(() => {
    // Play the victory arcade fanfare sound!
    sound.playWin();
    
    // Stagger certificate load and golden stamp animation
    const timer1 = setTimeout(() => setShowCertificate(true), 400);
    const timer2 = setTimeout(() => {
      setStampActive(true);
      // Trigger a mini correct chime on stamp
      sound.playCorrect();
    }, 1400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [winner]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none relative">
      
      {/* Decorative Fireworks Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping duration-1000" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-red-500 rounded-full animate-ping duration-700" />
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-ping duration-500" />
        <div className="absolute top-1/2 right-10 w-2 h-2 bg-emerald-400 rounded-full animate-ping duration-900" />
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex p-4 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400 mb-4 animate-bounce">
          <Trophy className="w-16 h-16" strokeWidth="2.5" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          G'ALABA MUBORAK!
        </h1>
        <p className="text-slate-300 mt-2 text-sm md:text-base font-medium">
          IT Shaharcha Xatirchi arenasi yangi chempionni aniqladi!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-10">
        
        {/* Left Team Final Status */}
        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
          <span className="text-3xl mb-1">{leftTeam.emoji}</span>
          <h3 className="font-bold text-slate-300 text-sm tracking-wide">{leftTeam.name}</h3>
          <div className="text-3xl font-black font-mono text-cyan-400 mt-2">{leftTeam.score} ball</div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">CHAP MAYDON</span>
        </div>

        {/* Center Champion Big Announcement Card */}
        <div className="bg-gradient-to-b from-amber-500/20 to-slate-950 border-2 border-amber-500 p-6 rounded-3xl flex flex-col justify-between items-center text-center shadow-xl shadow-amber-500/5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              ⚡ BIRINCHI O'RIN ⚡
            </span>
            <div className="text-5xl my-2 animate-bounce">{winner.emoji}</div>
            <h2 className="text-2xl font-black text-white">{winner.name}</h2>
            <p className="text-xs text-slate-300">
              Raqiblaridan tezroq harakat qilib, g'alaba marrasini birinchi bo'lib zabt etdi!
            </p>
          </div>

          <div className="mt-6 w-full bg-amber-500 text-slate-950 font-black tracking-widest text-lg py-2.5 rounded-xl border border-amber-400">
            {winner.score} BALL BILAN CHEMPION!
          </div>
        </div>

        {/* Right Team Final Status */}
        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
          <span className="text-3xl mb-1">{rightTeam.emoji}</span>
          <h3 className="font-bold text-slate-300 text-sm tracking-wide">{rightTeam.name}</h3>
          <div className="text-3xl font-black font-mono text-rose-400 mt-2">{rightTeam.score} ball</div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">O'NG MAYDON</span>
        </div>

      </div>

      {/* Interactive Cyber-Certificate Frame for classroom photos */}
      {showCertificate && (
        <div className="mb-10 bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-800 p-6 rounded-3xl relative shadow-2xl transition-all duration-700 animate-fade-in scale-100 max-w-2xl mx-auto">
          
          {/* Authentic Watermark Border */}
          <div className="absolute inset-1.5 border border-dashed border-slate-800/80 rounded-2xl pointer-events-none" />
          
          {/* Certificate Header branding */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest font-mono">DIPLOM TAQDIRLASH</span>
                <h4 className="text-xs text-white font-extrabold font-mono">IT SHAHARCHA XATIRCHI</h4>
              </div>
            </div>
            
            <span className="text-[9px] text-slate-500 font-semibold font-mono">ID: {Math.floor(100000 + Math.random() * 900000)}</span>
          </div>

          {/* Certificate Main Text */}
          <div className="text-center py-4 space-y-3 relative">
            <span className="text-[11px] text-cyan-400 font-extrabold uppercase tracking-widest font-mono">FAXRIY YORLIQ</span>
            <h3 className="text-3xl font-black text-white px-2">
              {winner.name.toUpperCase()}
            </h3>
            
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Xatirchi tumanidagi <span className="text-amber-400 font-bold">Yoshlar Axborot Texnologiyalari Markazi (IT Shaharcha)</span> Interaktiv Bellashuv Arenasida o'zining beqiyos bilimi va chaqqonligi bilan yuqori natija hisobiga erishganligi uchun taqdirlanadi.
            </p>

            <div className="pt-2 flex justify-between items-end max-w-md mx-auto text-left border-t border-slate-900/60 font-mono text-[9px] text-slate-500">
              <div>
                <span>Sana: {new Date().toLocaleDateString('uz-UZ')}</span>
                <br />
                <span>Qabul qildi: Markaz hakamligi</span>
              </div>
              
              <div className="text-right">
                <span>IT Shaharcha Xatirchi</span>
                <br />
                <span className="text-emerald-500 font-semibold">Tugallandi / Verifikatsiya qilingan</span>
              </div>
            </div>

            {/* Simulated Stamp Badge with animations */}
            {stampActive && (
              <div className="absolute right-4 top-[50%] -translate-y-[50%] rotate-12 scale-110 pointer-events-none transition-all duration-300">
                <div className="border-4 border-amber-500 bg-slate-950/90 py-1.5 px-3 rounded-xl text-center shadow-xl">
                  <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase block font-mono">QA`BUL QILINDI</span>
                  <span className="text-[7px] text-amber-500 font-bold font-mono">IT-SHAHARCHA MATCH_WIN</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Navigation Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        
        {/* Rematch */}
        <button
          id="btn_rematch"
          onClick={onRematch}
          className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <RefreshCw className="w-5 h-5" />
          Qayta o'ynash (Rematch)
        </button>

        {/* Back to Home Main Menu */}
        <button
          id="btn_home_menu"
          onClick={onHome}
          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white font-black rounded-xl uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Home className="w-5 h-5 text-indigo-400" />
          Bosh sahifa (Menu)
        </button>

      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        O'qituvchilar ushbu muvaffaqiyatli dars lahzasini doska bilan suratga olishlari mumkin! 📸
      </div>

    </div>
  );
}
