import React from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';
import { Zap, AlertTriangle } from 'lucide-react';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: string) => void;
}

export const BreakerWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const current = (widget.currentValue as string) || 'NORMAL';
  const isTripped = current === 'TRIPPED';

  const handleToggle = () => {
    const nextVal = isTripped ? 'NORMAL' : 'TRIPPED';
    audioSynth.playSound('BUTTON', 1.8);
    audioSynth.vibrate(80);
    onUpdate(nextVal);
  };

  return (
    <div className="bg-space-900 border-2 border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
        <span className="text-terminal-amber truncate max-w-[140px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-amber-950/70 border border-amber-600/40 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
          HIGH VOLT
        </span>
      </div>

      {/* Heavy Breaker Lever */}
      <div className="flex-1 w-full flex items-center justify-center">
        <button
          type="button"
          onClick={handleToggle}
          className={`relative w-4/5 h-20 rounded-lg border-2 p-1.5 transition-all duration-200 flex flex-col justify-between items-center cursor-pointer shadow-xl ${
            isTripped
              ? 'bg-red-950/70 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              : 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }`}
          style={{
            backgroundImage: isTripped
              ? 'repeating-linear-gradient(45deg, rgba(239,68,68,0.1), rgba(239,68,68,0.1) 10px, transparent 10px, transparent 20px)'
              : 'repeating-linear-gradient(45deg, rgba(16,185,129,0.1), rgba(16,185,129,0.1) 10px, transparent 10px, transparent 20px)'
          }}
        >
          <div className="w-full flex justify-between items-center px-1">
            <span className="text-[9px] font-mono font-bold text-slate-400">ISOLATOR</span>
            {isTripped ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>

          {/* Lever handle */}
          <div
            className={`w-full py-2 rounded font-display font-black text-xs tracking-wider transition-all duration-200 border text-center shadow-md ${
              isTripped
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-400 translate-y-1'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-400 -translate-y-1'
            }`}
          >
            {isTripped ? '⚡ TRIPPED / ISOLATED' : '✓ NORMAL / ONLINE'}
          </div>

          <div className="text-[8px] font-mono text-slate-400 tracking-widest uppercase">
            CLICK TO {isTripped ? 'ENGAGE' : 'PULL'}
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
        <span className="text-slate-400">BREAKER RELAY</span>
        <span className={`font-mono font-bold text-[9px] ${isTripped ? 'text-red-400' : 'text-emerald-400'}`}>
          {isTripped ? 'DISCONNECTED' : 'CLOSED CIRCUIT'}
        </span>
      </div>
    </div>
  );
};
