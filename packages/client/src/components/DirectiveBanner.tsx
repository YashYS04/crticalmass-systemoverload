import React, { useEffect, useState } from 'react';
import { Task } from '@system-overload/shared';
import { AlertCircle, Megaphone, Clock } from 'lucide-react';

interface Props {
  task: Task | undefined;
}

export const DirectiveBanner: React.FC<Props> = ({ task }) => {
  const [percentRemaining, setPercentRemaining] = useState<number>(100);

  useEffect(() => {
    if (!task) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = task.deadline - now;
      const pct = Math.max(0, Math.min(100, (remainingMs / task.durationMs) * 100));
      setPercentRemaining(pct);
    }, 50);

    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="w-full bg-space-900/90 border border-slate-700/60 rounded-xl p-3 flex items-center justify-center text-slate-400 text-xs font-mono shadow-md">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          STANDBY: ALL DIRECTIVES OPERATIONAL — MONITORING CORE FREQUENCIES
        </span>
      </div>
    );
  }

  const isCatastrophic = task.urgency === 'CATASTROPHIC' || percentRemaining < 25;
  const isCritical = task.urgency === 'CRITICAL' || percentRemaining < 50;

  return (
    <div
      className={`w-full rounded-xl border-2 p-3 relative overflow-hidden transition-all duration-300 shadow-2xl ${
        isCatastrophic
          ? 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse-fast'
          : isCritical
          ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
          : 'bg-space-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
        <div className="flex items-center gap-1.5 uppercase tracking-widest">
          <Megaphone className={`w-4 h-4 ${isCatastrophic ? 'text-red-400' : 'text-amber-400'}`} />
          <span className={isCatastrophic ? 'text-red-300' : isCritical ? 'text-amber-300' : 'text-cyan-300'}>
            COMMUNICATION DIRECTIVE — YELL TO CREW!
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{Math.max(0, Math.ceil((task.deadline - Date.now()) / 1000))}s</span>
        </div>
      </div>

      {/* The Instruction Command */}
      <div className="text-center py-1">
        <h2 className="font-display font-black text-lg sm:text-2xl text-white tracking-wider drop-shadow-md">
          {task.instruction}
        </h2>
      </div>

      {/* Target Hint */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-700/50 pt-1">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-terminal-amber" />
          TARGET VALUE: <strong className="text-white ml-0.5">{task.displayValue}</strong>
        </span>
        <span className="text-slate-400 text-[9px] uppercase tracking-wider">
          +{task.points} PTS REWARD
        </span>
      </div>

      {/* Animated Countdown Progress Bar */}
      <div className="w-full h-2 bg-black/60 rounded-full mt-2 overflow-hidden border border-slate-700">
        <div
          className={`h-full transition-all duration-75 ${
            isCatastrophic ? 'bg-red-500' : isCritical ? 'bg-amber-400' : 'bg-cyan-400'
          }`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
};
