import React from 'react';
import { ControlWidget } from '@system-overload/shared';
import { ButtonWidget } from './widgets/ButtonWidget';
import { SwitchWidget } from './widgets/SwitchWidget';
import { SliderWidget } from './widgets/SliderWidget';
import { DialWidget } from './widgets/DialWidget';
import { BreakerWidget } from './widgets/BreakerWidget';
import { KeypadWidget } from './widgets/KeypadWidget';
import { Wrench } from 'lucide-react';

interface Props {
  widgets: ControlWidget[];
  onUpdateControl: (controlId: string, value: number | boolean | string) => void;
}

export const ControlPanel: React.FC<Props> = ({ widgets, onUpdateControl }) => {
  if (widgets.length === 0) {
    return (
      <div className="w-full bg-space-900 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
        <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-500 animate-spin" />
        <p className="font-mono text-sm">CALIBRATING YOUR CONSOLE HARDWARE...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Console Subheader */}
      <div className="flex justify-between items-center px-1 mb-2">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          PRIMARY PHYSICAL CONTROLS ({widgets.length} ACTIVE MODULES)
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-space-900 px-2 py-0.5 rounded border border-slate-700">
          LISTEN TO CREWMATE CALLOUTS
        </span>
      </div>

      {/* Responsive Grid of Tactile Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {widgets.map((widget) => {
          switch (widget.type) {
            case 'BUTTON':
              return (
                <ButtonWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            case 'SWITCH':
              return (
                <SwitchWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            case 'SLIDER':
              return (
                <SliderWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            case 'DIAL':
              return (
                <DialWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            case 'BREAKER':
              return (
                <BreakerWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            case 'KEYPAD':
              return (
                <KeypadWidget
                  key={widget.id}
                  widget={widget}
                  onUpdate={(val) => onUpdateControl(widget.id, val)}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
