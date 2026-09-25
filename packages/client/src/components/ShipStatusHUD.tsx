import React from 'react';
import { ShipStatus } from '@system-overload/shared';
import { Shield, FastForward, Flame, Volume2, VolumeX, Tv, AlertTriangle } from 'lucide-react';
import { audioSynth } from './AudioSynth';

interface Props {
  ship: ShipStatus;
  crtEnabled: boolean;
  toggleCrt: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const ShipStatusHUD: React.FC<Props> = ({
  ship,
  crtEnabled,
  toggleCrt,
  soundEnabled,
  toggleSound,
}) => {
  const hullPct = Math.max(0, Math.min(100, Math.round(ship.hullIntegrity)));
  const warpPct = Math.max(0, Math.min(100, Math.round(ship.warpProgress)));

  const hullColor =
    hullPct > 60
      ? 'bg-emerald-500'
      : hullPct > 30
      ? 'bg-amber-500'
      : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full bg-space-900 border-2 border-slate-700/80 rounded-xl p-3 shadow-xl panel-bevel select-none">
      {/* Top Telemetry & Controls */}
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="bg-space-950 px-2 py-1 rounded border border-slate-700 font-display font-black text-terminal-cyan text-xs">
            SECTOR {ship.sector} / {ship.totalSectors}
          </div>
          {ship.comboStreak > 1 && (
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold text-[10px] animate-bounce">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{ship.comboStreak}x STREAK</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs font-bold text-slate-300">
            SCORE: <span className="text-terminal-amber glow-amber font-extrabold">{ship.score}</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
            <button
              type="button"
              onClick={toggleSound}
              className="p-1 rounded bg-space-850 hover:bg-space-800 text-slate-300 border border-slate-700"
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
            </button>
            <button
              type="button"
              onClick={toggleCrt}
              className={`p-1 rounded bg-space-850 hover:bg-space-800 text-slate-300 border border-slate-700 ${
                crtEnabled ? 'text-cyan-400' : 'text-slate-500'
              }`}
              title="Toggle CRT Scanline Overlay"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gauges: Hull & Warp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Hull Integrity Bar */}
        <div className="bg-space-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-center">
          <div className="flex justify-between items-center text-[11px] mb-1 font-bold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className={`w-3.5 h-3.5 ${hullPct < 30 ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
              HULL INTEGRITY
            </span>
            <span className={`font-mono text-xs font-black ${hullPct < 30 ? 'text-red-400' : 'text-emerald-400'}`}>
              {hullPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-space-900 rounded-full overflow-hidden border border-slate-750 p-0.5">
            <div className={`h-full rounded-full transition-all duration-300 ${hullColor}`} style={{ width: `${hullPct}%` }} />
          </div>
        </div>

        {/* Warp Drive Charge Bar */}
        <div className="bg-space-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-center">
          <div className="flex justify-between items-center text-[11px] mb-1 font-bold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              WARP DRIVE SPOOL
            </span>
            <span className="font-mono text-xs font-black text-cyan-400 glow-cyan">
              {warpPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-space-900 rounded-full overflow-hidden border border-slate-750 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-600 via-cyan-400 to-indigo-400 shadow-[0_0_10px_#22d3ee]"
              style={{ width: `${warpPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
