import React from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';
import { RotateCw } from 'lucide-react';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: string) => void;
}

export const DialWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const options = widget.config?.options || ['STABLE', 'PRIMED', 'OVERDRIVE', 'VENT'];
  const current = (widget.currentValue as string) || options[0];
  const currentIndex = Math.max(0, options.indexOf(current));

  // Compute angle (e.g. 4 options spread from -135deg to +135deg)
  const totalOptions = options.length;
  const startAngle = -120;
  const endAngle = 120;
  const angleStep = (endAngle - startAngle) / (totalOptions - 1);
  const currentAngle = startAngle + currentIndex * angleStep;

  const handleStep = () => {
    const nextIndex = (currentIndex + 1) % totalOptions;
    const nextVal = options[nextIndex];
    audioSynth.playSound('CLICK', 1.4);
    audioSynth.vibrate(35);
    onUpdate(nextVal);
  };

  return (
    <div className="bg-space-900 border-2 border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
        <span className="text-terminal-purple truncate max-w-[140px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{widget.category}</span>
      </div>

      {/* Rotary Dial */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <button
          type="button"
          onClick={handleStep}
          className="relative w-20 h-20 rounded-full bg-gradient-to-b from-space-800 to-space-950 border-4 border-slate-650 shadow-[0_6px_12px_rgba(0,0,0,0.7)] flex items-center justify-center cursor-pointer transition-transform active:scale-95 group"
        >
          {/* Outer notch indicator marks */}
          <div
            className="w-full h-full rounded-full transition-transform duration-200 flex items-start justify-center p-1.5"
            style={{ transform: `rotate(${currentAngle}deg)` }}
          >
            {/* Knob pointer line & glowing led */}
            <div className="w-1.5 h-4 bg-purple-400 rounded-full shadow-[0_0_8px_#c084fc]" />
          </div>

          <div className="absolute w-9 h-9 rounded-full bg-space-900 border border-purple-550/40 flex items-center justify-center shadow-inner">
            <RotateCw className="w-3.5 h-3.5 text-purple-300 opacity-60 group-hover:rotate-45 transition-transform" />
          </div>
        </button>

        {/* Current mode text */}
        <span className="mt-1 font-mono font-black text-xs text-purple-300 tracking-wider">
          {current}
        </span>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
        <span className="text-slate-400">ROTARY SELECT</span>
        <span className="text-purple-400/80 text-[9px] font-mono">TAP TO ROTATE</span>
      </div>
    </div>
  );
};
