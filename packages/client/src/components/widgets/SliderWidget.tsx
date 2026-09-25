import React, { useRef } from 'react';
import { ControlWidget } from '@system-overload/shared';
import { audioSynth } from '../AudioSynth';

interface Props {
  widget: ControlWidget;
  onUpdate: (value: number) => void;
}

export const SliderWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const min = widget.config?.min ?? 0;
  const max = widget.config?.max ?? 100;
  const step = widget.config?.step ?? 10;
  const unit = widget.config?.unit || '%';
  const current = Number(widget.currentValue ?? min);
  const lastTickValueRef = useRef<number>(current);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (Math.abs(val - lastTickValueRef.current) >= step) {
      audioSynth.playSound('TICK', 0.8);
      audioSynth.vibrate(20);
      lastTickValueRef.current = val;
    }
    onUpdate(val);
  };

  return (
    <div className="bg-space-900 border-2 border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between items-center panel-bevel h-44 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
        <span className="text-terminal-green truncate max-w-[140px] uppercase tracking-wider">{widget.label}</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{widget.category}</span>
      </div>

      {/* Slider Area */}
      <div className="flex-1 w-full flex flex-col justify-center items-center px-1">
        {/* Value Readout Display */}
        <div className="bg-black/60 border border-green-500/30 px-3 py-1 rounded-md mb-2 flex items-baseline gap-1">
          <span className="font-mono text-xl font-extrabold text-terminal-green glow-green">{current}</span>
          <span className="font-mono text-xs text-green-400/70">{unit}</span>
        </div>

        {/* Tactile Range Input */}
        <div className="w-full relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={current}
            onChange={handleChange}
            className="w-full h-3 bg-space-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-700 focus:outline-none"
          />
        </div>

        {/* Tick markers */}
        <div className="w-full flex justify-between px-1 text-[8px] font-mono text-slate-500 mt-1">
          <span>{min}</span>
          <span>{Math.round((max - min) / 2)}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
        <span className="text-slate-400">CALIBRATION</span>
        <span className="font-mono text-emerald-400 font-bold text-[10px]">STEP: ±{step}</span>
      </div>
    </div>
  );
};
