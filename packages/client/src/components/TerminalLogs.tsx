import React, { useState } from 'react';
import { GameLogEntry } from '@system-overload/shared';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  logs: GameLogEntry[];
}

export const TerminalLogs: React.FC<Props> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-space-950/95 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all select-none">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-1.5 bg-space-900 border-b border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-terminal-cyan" />
          <span className="font-bold tracking-wider">SUBSYSTEM TELEMETRY LOG</span>
          <span className="text-[10px] text-slate-500">({logs.length} EVENTS)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span>{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Log entries */}
      <div
        className={`px-3 py-2 font-mono text-[10px] space-y-1 overflow-y-auto transition-all ${
          isExpanded ? 'max-h-48' : 'max-h-16'
        }`}
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">No telemetry recorded yet.</div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            let color = 'text-slate-400';
            if (log.type === 'SUCCESS') color = 'text-emerald-400';
            if (log.type === 'DANGER') color = 'text-red-400 font-bold';
            if (log.type === 'WARNING') color = 'text-amber-400';
            if (log.type === 'WARP') color = 'text-cyan-300 font-bold';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 shrink-0">[{timeStr}]</span>
                <span className={`break-words ${color}`}>{log.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
