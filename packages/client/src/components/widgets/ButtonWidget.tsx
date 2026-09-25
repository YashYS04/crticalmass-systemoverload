import React, { useState } from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';
import { ShieldAlert, Check } from 'lucide-react';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: boolean) => void;
}

export const ButtonWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const [coverOpen, setCoverOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const requiresCover = widget.config?.requiresConfirmation;

  const handlePress = () => {
    if (requiresCover && !coverOpen) {
      audioSynth.playSound('TICK');
      return;
    }
    setIsPressed(true);
    audioSynth.playSound('BUTTON', 1.5);
    audioSynth.vibrate(60);
    onUpdate(true);

    setTimeout(() => {
      setIsPressed(false);
    }, 250);
  };

  const toggleCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playSound('CLICK', 1.2);
    setCoverOpen(!coverOpen);
  };

  return (
    <div className="relative bg-space-900 border-2 border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Category & Label Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
        <span className="text-terminal-amber truncate max-w-[140px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{widget.category}</span>
      </div>

      {/* Button & Cover Area */}
      <div className="relative flex-1 flex items-center justify-center w-full">
        {/* Safety Cover (if applicable) */}
        {requiresCover && (
          <button
            onClick={toggleCover}
            type="button"
            className={`absolute z-20 w-24 h-24 rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-xl ${
              coverOpen
                ? '-top-6 opacity-30 bg-amber-900/40 border-amber-600 scale-90'
                : 'top-1 bg-amber-500/20 backdrop-blur-sm border-amber-500 hover:bg-amber-500/30'
            }`}
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(245, 158, 11, 0.15) 10px, rgba(245, 158, 11, 0.15) 20px)'
            }}
          >
            <ShieldAlert className={`w-6 h-6 text-amber-400 ${coverOpen ? 'rotate-180' : 'animate-pulse'}`} />
            <span className="text-[9px] font-black text-amber-300 mt-1 uppercase tracking-widest">
              {coverOpen ? 'COVER OPEN' : 'ARMED COVER'}
            </span>
            <span className="text-[8px] text-amber-200/70">{coverOpen ? 'TAP TO SHUT' : 'TAP TO LIFT'}</span>
          </button>
        )}

        {/* The Big Industrial Push Button */}
        <button
          type="button"
          onClick={handlePress}
          className={`w-24 h-24 rounded-full transition-transform active:scale-95 flex flex-col items-center justify-center font-display font-black text-sm tracking-widest border-4 ${
            isPressed
              ? 'bg-red-700 border-red-900 shadow-inner scale-95 translate-y-1'
              : 'bg-gradient-to-b from-red-500 to-red-700 border-red-400/80 shadow-[0_8px_0_0_#7f1d1d,0_15px_20px_rgba(0,0,0,0.6)] hover:brightness-110'
          }`}
        >
          <div className="w-16 h-16 rounded-full border-2 border-red-300/40 flex items-center justify-center">
            <span className="text-white text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center leading-tight">
              {isPressed ? 'ENGAGED' : 'PRESS'}
            </span>
          </div>
        </button>
      </div>

      {/* Status LED */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
        <span className="text-slate-400">ACTUATOR</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isPressed ? 'bg-terminal-green animate-ping' : 'bg-red-500'}`} />
          <span className="font-mono text-[9px] text-slate-300">{isPressed ? 'TRIGGERED' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};
