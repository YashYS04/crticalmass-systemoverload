import React, { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { LobbyView } from './components/LobbyView';
import { ShipStatusHUD } from './components/ShipStatusHUD';
import { DirectiveBanner } from './components/DirectiveBanner';
import { ControlPanel } from './components/ControlPanel';
import { TerminalLogs } from './components/TerminalLogs';
import { MissionDebriefModal } from './components/MissionDebriefModal';
import { audioSynth } from './components/AudioSynth';
import { AlertTriangle, Radio, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const {
    isConnected,
    roomState,
    myPlayerId,
    screenShake,
    errorMessage,
    lastWarpMessage,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    updateControl,
    restartGame,
    leaveRoom,
  } = useGameSocket();

  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioSynth.enabled = next;
    if (next) audioSynth.playSound('CLICK');
  };

  // Extract this player's active directive (to shout to others)
  const myDirective = roomState?.activeTasks.find(
    (t) => t.recipientPlayerId === myPlayerId && t.status === 'ACTIVE'
  );

  // Extract this player's physical widgets
  const myWidgets = roomState?.widgets
    ? Object.values(roomState.widgets).filter((w) => w.ownerPlayerId === myPlayerId)
    : [];

  const isGameRunning = roomState?.state === 'IN_GAME';
  const isCountdown = roomState?.state === 'STARTING';
  const isGameOver = roomState?.state === 'GAME_OVER' || roomState?.state === 'VICTORY';

  return (
    <div
      className={`min-h-screen bg-space-950 text-slate-100 flex flex-col relative transition-all duration-75 ${
        screenShake.active ? (screenShake.intensity > 15 ? 'shake-heavy' : 'shake-light') : ''
      }`}
    >
      {/* CRT Overlay Effect */}
      {crtEnabled && <div className="crt-overlay fixed inset-0 pointer-events-none z-40" />}

      {/* Connection & Error Toasts */}
      {!isConnected && (
        <div className="bg-red-600/90 text-white text-xs font-mono py-1.5 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-lg">
          <Radio className="w-3.5 h-3.5 animate-spin" />
          <span>STATION LINK OFFLINE — RECONNECTING TO GAME SERVER...</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-amber-600/95 text-black text-xs font-mono py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-xl font-bold">
          <AlertTriangle className="w-4 h-4 text-black" />
          <span>{errorMessage}</span>
        </div>
      )}

      {lastWarpMessage && (
        <div className="bg-cyan-500/95 text-black text-sm font-display font-black py-2.5 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-2xl tracking-widest animate-bounce">
          <Sparkles className="w-5 h-5 text-black" />
          <span>{lastWarpMessage}</span>
        </div>
      )}

      {/* Main Game Screen Routing */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 flex flex-col items-center justify-start gap-4">
        {/* If in Lobby or No Room */}
        {(!roomState || roomState.state === 'LOBBY') && (
          <LobbyView
            roomState={roomState}
            myPlayerId={myPlayerId}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
          />
        )}

        {/* Starting Countdown Overlay */}
        {isCountdown && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-4">
            <div className="font-mono text-sm text-cyan-400 uppercase tracking-widest mb-2">
              WARP CORE SPOOLING UP
            </div>
            <div className="font-display font-black text-8xl text-red-500 glow-red animate-ping mb-4">
              {roomState?.countdownRemaining ?? 3}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Prepare to scream directives to your crewmates!
            </div>
          </div>
        )}

        {/* Active In-Game Screen */}
        {(isGameRunning || isGameOver) && roomState && (
          <div className="w-full flex flex-col gap-4">
            {/* Top Ship Telemetry HUD */}
            <ShipStatusHUD
              ship={roomState.ship}
              crtEnabled={crtEnabled}
              toggleCrt={() => setCrtEnabled(!crtEnabled)}
              soundEnabled={soundEnabled}
              toggleSound={toggleSound}
            />

            {/* Directive to shout out */}
            <DirectiveBanner task={myDirective} />

            {/* Player's physical hardware control panel */}
            <ControlPanel
              widgets={myWidgets}
              onUpdateControl={updateControl}
            />

            {/* Subsystem Telemetry Logs */}
            <TerminalLogs logs={roomState.recentLogs} />
          </div>
        )}

        {/* Mission Victory / Meltdown Debrief Modal */}
        {isGameOver && roomState && (
          <MissionDebriefModal
            roomState={roomState}
            myPlayerId={myPlayerId}
            onRestart={restartGame}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-2 text-center text-[10px] font-mono text-slate-400 border-t border-slate-850">
        CRITICAL MASS: SYSTEM OVERLOAD &bull; REAL-TIME DISTRIBUTED MULTIPLAYER &bull; NO LOGINS &bull; ZERO LATENCY
      </footer>
    </div>
  );
};
