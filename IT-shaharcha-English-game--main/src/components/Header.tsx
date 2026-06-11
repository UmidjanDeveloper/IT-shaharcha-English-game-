import React from 'react';
import { Network, Sparkles, Award } from 'lucide-react';

interface HeaderProps {
  leftScore?: number;
  rightScore?: number;
  leftTeamName?: string;
  rightTeamName?: string;
  leftColor?: string;
  rightColor?: string;
  onReset?: () => void;
}

export default function Header({
  leftScore,
  rightScore,
  leftTeamName = 'Chap Jamoa',
  rightTeamName = 'O\'ng Jamoa',
  leftColor = '#3b82f6',
  rightColor = '#ef4444',
  onReset
}: HeaderProps) {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 text-white py-3 px-6 select-none relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Animated Custom IT Shaharcha Logo based on user's logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onReset} title="Bosh sahifaga qaytish">
          <div className="relative w-14 h-14 flex-shrink-0">
            {/* SVG implementation of the IT Shaharcha Network Tree */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Branch Network lines */}
              <line x1="30" y1="80" x2="30" y2="45" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <line x1="45" y1="80" x2="45" y2="40" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <line x1="60" y1="80" x2="60" y2="48" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <line x1="45" y1="55" x2="20" y2="35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="45" y1="50" x2="75" y2="35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              
              {/* Interconnected Web elements */}
              <line x1="20" y1="35" x2="40" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <line x1="40" y1="20" x2="60" y2="15" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <line x1="60" y1="15" x2="75" y2="35" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <line x1="20" y1="35" x2="60" y2="15" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              
              {/* Colorful Nodes from the brand logo (cyan, orange, red, green, purple, yellow) */}
              <circle cx="20" cy="35" r="7" fill="#ef4444" className="animate-pulse" /> {/* Red */}
              <circle cx="40" cy="20" r="9" fill="#06b6d4" /> {/* Cyan */}
              <circle cx="60" cy="15" r="6" fill="#10b981" /> {/* Green */}
              <circle cx="75" cy="35" r="10" fill="#f97316" /> {/* Orange */}
              <circle cx="50" cy="30" r="5" fill="#a855f7" /> {/* Purple */}
              <circle cx="30" cy="15" r="5" fill="#eab308" /> {/* Yellow */}
            </svg>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">IT Shaharcha</span>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono tracking-wide">XATIRCHI</span>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-amber-500 to-transparent w-full my-0.5" />
            <span className="text-[10px] md:text-xs text-slate-300 font-medium uppercase tracking-wider">
              Yoshlar Axborot Texnologiyalari Markazi
            </span>
          </div>
        </div>

        {/* Live Active Scores for interactive board */}
        {leftScore !== undefined && rightScore !== undefined && (
          <div className="flex items-center gap-6 bg-slate-900 px-6 py-2 rounded-2xl border border-slate-800 shadow-xl shadow-black/40">
            {/* Left team */}
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold" style={{ color: leftColor }}>
                {leftTeamName}
              </span>
              <div 
                className="text-3xl font-black font-mono w-14 h-12 flex items-center justify-center rounded-xl border border-slate-700/60 shadow-inner bg-slate-950/85"
                style={{ color: leftColor }}
              >
                {leftScore}
              </div>
            </div>

            <div className="text-xl font-bold text-slate-500 font-mono animate-pulse">VS</div>

            {/* Right team */}
            <div className="flex items-center gap-3">
              <div 
                className="text-3xl font-black font-mono w-14 h-12 flex items-center justify-center rounded-xl border border-slate-700/60 shadow-inner bg-slate-950/85"
                style={{ color: rightColor }}
              >
                {rightScore}
              </div>
              <span className="text-lg font-bold" style={{ color: rightColor }}>
                {rightTeamName}
              </span>
            </div>
          </div>
        )}

        {/* Global Action / Settings indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
            id="btn_back_bosh_sahifa"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Menyu
          </button>
        </div>

      </div>
    </header>
  );
}
