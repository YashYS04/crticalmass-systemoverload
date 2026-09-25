import React, { useState } from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';
import { Hash, Delete, Check } from 'lucide-react';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: string) => void;
}

export const KeypadWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const [buffer, setBuffer] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (buffer.length < 3) {
      const next = buffer + digit;
      setBuffer(next);
      audioSynth.playSound('TICK', 1.2);
      audioSynth.vibrate(25);

      // Auto submit on 3 digits
      if (next.length === 3) {
        audioSynth.playSound('BUTTON', 1.3);
        onUpdate(next);
        setTimeout(() => setBuffer(''), 1000);
      }
    }
  };

  const handleClear = () => {
    audioSynth.playSound('CLICK', 1.0);
    setBuffer('');
  };

  return (
    <div className="bg-space-900 border-2 border-slate-700/80 rounded-xl p-3 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1">
        <span className="text-terminal-cyan truncate max-w-[130px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 text-[9px]">KEYPAD</span>
      </div>

      {/* Screen & Mini Keypad Grid */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        {/* LCD Screen */}
        <div className="flex-1 bg-black/80 border border-cyan-500/40 rounded-lg p-2 flex flex-col items-center justify-center h-20 shadow-inner">
          <span className="text-[8px] font-mono text-cyan-500/70 tracking-widest">INPUT BUFFER</span>
          <span className="font-mono text-xl font-extrabold text-cyan-400 glow-cyan tracking-widest">
            {buffer ? buffer.padEnd(3, '_') : '---'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="mt-1 text-[8px] text-red-400 hover:text-red-300 flex items-center gap-0.5 underline uppercase"
          >
            <Delete className="w-2.5 h-2.5" /> CLR
          </button>
        </div>

        {/* 3x3 Key Matrix */}
        <div className="grid grid-cols-3 gap-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-7 h-6 bg-space-850 hover:bg-space-800 active:bg-cyan-700 text-slate-200 active:text-white rounded border border-slate-700 font-mono font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-slate-800">
        <span className="text-slate-400">CIPHER:</span>
        <span className="font-mono text-cyan-300">ENTER 3-DIGIT CODE</span>
      </div>
    </div>
  );
};
