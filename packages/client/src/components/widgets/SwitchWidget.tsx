import React from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: string) => void;
}

export const SwitchWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const options = widget.config?.options || ['OFF', 'ENGAGED'];
  const current = (widget.currentValue as string) || options[0];

  const handleSelect = (opt: string) => {
    if (opt !== current) {
      audioSynth.playSound('SWITCH', 1.2);
      audioSynth.vibrate(40);
      onUpdate(opt);
    }
  };

  return (
    <div className="bg-space-900 border-2 border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
        <span className="text-terminal-cyan truncate max-w-[140px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{widget.category}</span>
      </div>

      {/* Switch Toggle Container */}
      <div className="flex-1 w-full flex flex-col justify-center items-center">
        <div className="bg-space-950 p-1.5 rounded-xl border border-slate-800 w-full flex justify-around items-center gap-1 shadow-inner">
          {options.map((opt) => {
            const isActive = current === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`flex-1 py-3 px-1.5 rounded-lg text-xs font-black font-display tracking-wider transition-all duration-150 flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-600 to-cyan-800 text-white shadow-lg border border-cyan-400 scale-[1.03]'
                    : 'bg-space-850 text-slate-400 hover:text-slate-200 hover:bg-space-800 border border-slate-750'
                }`}
              >
                <span className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
                <span className="truncate max-w-full">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
        <span className="text-slate-400">STATE:</span>
        <span className="font-mono text-cyan-400 font-bold text-[10px]">{current}</span>
      </div>
    </div>
  );
};
