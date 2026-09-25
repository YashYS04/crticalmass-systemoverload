import React, { useEffect } from 'react';
import { Player, RoomPublicState } from '@system-overload/shared';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Award, CheckCircle, XCircle } from 'lucide-react';
import { audioSynth } from './AudioSynth';

interface Props {
  roomState: RoomPublicState;
  myPlayerId: string | null;
  onRestart: () => void;
}

export const MissionDebriefModal: React.FC<Props> = ({ roomState, myPlayerId, onRestart }) => {
  const isVictory = roomState.state === 'VICTORY';
  const players = Object.values(roomState.players);
  
  // Find MVP (highest tasks completed)
  const mvp = [...players].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0];
  const myPlayer = myPlayerId ? roomState.players[myPlayerId] : null;

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-space-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl panel-bevel">
        {/* Result Icon */}
        <div className="inline-flex p-4 rounded-2xl mb-3 shadow-xl">
          {isVictory ? (
            <div className="p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl animate-bounce">
              <Trophy className="w-12 h-12 text-emerald-400" />
            </div>
          ) : (
            <div className="p-3 bg-red-500/20 border-2 border-red-500 rounded-2xl">
              <Skull className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-widest uppercase mb-1">
          {isVictory ? 'MISSION ACCOMPLISHED!' : 'CORE MELTDOWN'}
        </h2>
        <div className={`font-mono text-xs font-bold uppercase tracking-wider mb-4 ${
          isVictory ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {isVictory ? 'ALL 5 SECTORS CLEARED — WARP CORRIDOR ESCAPED' : `HULL COMPROMISED IN SECTOR ${roomState.ship.sector}`}
        </div>

        {/* Total Score Banner */}
        <div className="bg-space-950 border border-slate-800 rounded-2xl p-3 mb-4 flex justify-around items-center">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">FINAL SCORE</div>
            <div className="font-mono text-2xl font-black text-terminal-amber glow-amber">
              {roomState.ship.score}
            </div>
          </div>
          <div className="h-8 border-r border-slate-800" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">SECTOR REACHED</div>
            <div className="font-mono text-xl font-black text-cyan-400">
              {roomState.ship.sector} / {roomState.ship.totalSectors}
            </div>
          </div>
        </div>

        {/* MVP Card */}
        {mvp && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 mb-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] font-mono text-amber-300 font-bold uppercase">CHIEF SQUAD MVP</div>
                <div className="font-display font-black text-sm text-white flex items-center gap-1.5">
                  <span>{mvp.avatar}</span>
                  <span>{mvp.name}</span>
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-amber-300">
              <span className="font-bold">{mvp.tasksCompleted}</span> Directives Solved
            </div>
          </div>
        )}

        {/* Crew Breakdown Table */}
        <div className="space-y-1.5 mb-5 max-h-36 overflow-y-auto pr-1">
          {players.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-xs font-mono p-2 bg-space-950/80 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                <span>{p.avatar}</span>
                <span className="text-slate-200 truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> {p.tasksCompleted}
                </span>
                <span className="text-red-400 flex items-center gap-0.5">
                  <XCircle className="w-3 h-3" /> {p.tasksFailed}
                </span>
                <span className="font-bold text-white">+{p.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action: Reboot & Play Again */}
        {myPlayer?.isHost ? (
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-display font-black text-sm tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 border border-cyan-400"
          >
            <RotateCcw className="w-4 h-4" />
            REBOOT SYSTEM / PLAY AGAIN
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 bg-space-950 py-3 rounded-xl border border-slate-800">
            Waiting for Station Host to reboot system...
          </div>
        )}
      </div>
    </div>
  );
};
