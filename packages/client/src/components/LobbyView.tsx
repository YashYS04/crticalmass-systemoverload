import React, { useState, useEffect, useRef } from 'react';
import { Player, PLAYER_ROLES, RoomPublicState } from '@system-overload/shared';
import QRCode from 'qrcode';
import { 
  Rocket, 
  Users, 
  Copy, 
  Check, 
  QrCode, 
  Share2, 
  Sparkles, 
  Play, 
  Radio, 
  ShieldCheck, 
  Wifi, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { audioSynth } from './AudioSynth';

interface Props {
  roomState: RoomPublicState | null;
  myPlayerId: string | null;
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const AVATARS = ['🚀', '⚡', '🛸', '🛰️', '🪐', '👾', '🛡️', '⚙️'];

export const LobbyView: React.FC<Props> = ({
  roomState,
  myPlayerId,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}) => {
  // Check URL params for auto-join room code
  const urlParams = new URLSearchParams(window.location.search);
  const initialRoom = urlParams.get('room') || '';

  const [name, setName] = useState<string>(() => localStorage.getItem('so_player_name') || '');
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoom);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🚀');
  const [copied, setCopied] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<{ localIp: string; port: number | string; publicUrl: string | null } | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_SERVER_URL || '';
    fetch(`${apiBase}/api/network-info`)
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, []);

  const getSharableUrl = (roomCode: string) => {
    if (networkInfo?.publicUrl) {
      return `${networkInfo.publicUrl}?room=${roomCode}`;
    }
    const isLoopback = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLoopback && networkInfo?.localIp && networkInfo.localIp !== 'localhost') {
      return `http://${networkInfo.localIp}:${networkInfo.port || 3001}?room=${roomCode}`;
    }
    return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  };

  // Generate QR Code whenever in room or networkInfo changes
  useEffect(() => {
    if (roomState?.code) {
      const joinUrl = getSharableUrl(roomState.code);
      QRCode.toDataURL(joinUrl, { width: 250, margin: 1, color: { dark: '#06b6d4', light: '#0b0f19' } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR error', err));
    }
  }, [roomState?.code, networkInfo]);

  const handleCopyLink = () => {
    if (!roomState?.code) return;
    const joinUrl = getSharableUrl(roomState.code);
    navigator.clipboard.writeText(joinUrl);
    audioSynth.playSound('CLICK');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myPlayer = myPlayerId && roomState?.players ? roomState.players[myPlayerId] : null;
  const isHost = myPlayer?.isHost ?? false;
  const playersList: Player[] = roomState?.players ? Object.values(roomState.players) : [];
  const allReady = playersList.length > 0 && playersList.every(p => p.isReady);

  // 1. Initial State: NOT IN A ROOM YET
  if (!roomState) {
    return (
      <div className="max-w-md mx-auto w-full p-4 flex flex-col items-center">
        {/* Logo & Hero */}
        <div className="text-center my-6">
          <div className="inline-flex items-center justify-center p-3 bg-red-600/20 border-2 border-red-500 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-3">
            <Radio className="w-10 h-10 text-red-400 animate-pulse" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-widest glow-amber">
            CRITICAL MASS
          </h1>
          <div className="font-mono text-xs text-terminal-cyan tracking-[0.25em] font-extrabold uppercase mt-1">
            SYSTEM OVERLOAD
          </div>
          <p className="text-xs text-slate-400 font-mono mt-3 max-w-xs mx-auto">
            A live, room-code cooperative crisis game. Screaming instructions across the room is required.
          </p>
        </div>

        {/* Input Card */}
        <div className="w-full bg-space-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl panel-bevel">
          {/* Call-Sign / Name */}
          <div className="mb-4">
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
              CREW CALL-SIGN / NAME
            </label>
            <input
              type="text"
              maxLength={15}
              placeholder="e.g. Maverick, Ripley, Solo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-space-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 shadow-inner"
            />
          </div>

          {/* Avatar Selector */}
          <div className="mb-5">
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
              HELMET ICON
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    audioSynth.playSound('CLICK');
                    setSelectedAvatar(av);
                  }}
                  className={`py-2 text-xl rounded-xl border transition-all ${
                    selectedAvatar === av
                      ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_10px_#22d3ee] scale-105'
                      : 'bg-space-950 border-slate-800 hover:border-slate-650'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Create Room */}
            <button
              type="button"
              onClick={() => {
                audioSynth.playSound('BUTTON');
                onCreateRoom(name || 'Commander', selectedAvatar);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-sm tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 border border-amber-300"
            >
              <Rocket className="w-4 h-4 text-black" />
              CREATE NEW STATION ROOM
            </button>

            {/* Join Room Divider */}
            <div className="flex items-center my-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3">OR DOCK WITH CODE</span>
              <div className="flex-1 border-t border-slate-800" />
            </div>

            {/* Room Code input & Join */}
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="ROOM CODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-1/2 bg-space-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-white font-mono font-black text-base tracking-widest uppercase focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (roomCodeInput.trim().length >= 4) {
                    audioSynth.playSound('BUTTON');
                    onJoinRoom(roomCodeInput.trim().toUpperCase(), name || 'Engineer', selectedAvatar);
                  } else {
                    audioSynth.playSound('ALARM', 0.5);
                  }
                }}
                disabled={roomCodeInput.trim().length < 4}
                className="w-1/2 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white font-display font-black text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md border border-cyan-400"
              >
                <Users className="w-4 h-4" />
                JOIN STATION
              </button>
            </div>
          </div>
        </div>

        {/* How to Play accordion */}
        <div className="w-full mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 underline flex items-center justify-center gap-1 mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showHowToPlay ? 'Hide Mission Directives' : 'How does this multiplayer game work?'}
          </button>

          {showHowToPlay && (
            <div className="mt-3 p-4 bg-space-900 border border-slate-800 rounded-xl text-left text-xs font-mono text-slate-300 space-y-2 shadow-xl">
              <p>
                <strong className="text-cyan-400">1. Asymmetric Consoles:</strong> Every player receives a unique procedural control panel with tactile sliders, switches, dials, and push buttons.
              </p>
              <p>
                <strong className="text-amber-400">2. The Chaos Derangement:</strong> Urgent instructions appear on <em className="text-white">your</em> screen, but the physical control is on <em className="text-white">another crewmate's</em> phone or laptop!
              </p>
              <p>
                <strong className="text-red-400">3. Scream to Survive:</strong> Yell instructions out loud! If the timer expires, the ship takes hull damage. Complete directives to charge the Warp Drive and survive all 5 sectors!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. In Room Lobby: WAITING FOR CREW & START
  return (
    <div className="max-w-lg mx-auto w-full p-4 flex flex-col items-center">
      {/* Station Header & Room Code Display */}
      <div className="w-full bg-space-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl panel-bevel mb-4 text-center">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            STATION LINK ONLINE
          </span>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold"
          >
            DISCONNECT
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          ROOM PASSCODE (SHARE WITH CREW)
        </div>

        {/* Big Room Code */}
        <div className="my-2 flex items-center justify-center gap-3">
          <div className="bg-space-950 border-2 border-cyan-400/80 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <span className="font-display font-black text-3xl sm:text-4xl text-cyan-300 glow-cyan tracking-[0.2em]">
              {roomState.code}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-200 transition-colors shadow"
              title="Copy Join Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 text-cyan-400 transition-colors shadow"
              title="Show Join QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-400 mt-2">
          Point phone camera at QR code or open this link on your phone:
        </p>
        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-space-950 px-3 py-1.5 rounded-xl border border-cyan-500/50 text-cyan-300 font-mono text-xs select-all shadow-inner">
          <span>📱</span>
          <span className="font-bold underline">{getSharableUrl(roomState.code)}</span>
        </div>
      </div>

      {/* Crew Roster */}
      <div className="w-full bg-space-900 border-2 border-slate-700 rounded-2xl p-4 shadow-xl panel-bevel mb-4">
        <div className="flex justify-between items-center text-xs font-mono text-slate-300 font-bold border-b border-slate-800 pb-2 mb-3">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-terminal-cyan" />
            STATION CREW MANIFEST ({playersList.length}/8)
          </span>
          <span className="text-[10px] text-slate-400">
            {playersList.length === 1 ? 'SOLO TRAINING MODE' : 'COOPERATIVE MODE'}
          </span>
        </div>

        <div className="space-y-2">
          {playersList.map((player) => {
            const roleInfo = PLAYER_ROLES.find((r) => r.role === player.role) || PLAYER_ROLES[0];
            const isMe = player.id === myPlayerId;

            return (
              <div
                key={player.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-space-850 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-space-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{player.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-sm text-white">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="bg-cyan-950 border border-cyan-600 text-cyan-300 text-[9px] font-mono px-1.5 py-0.2 rounded">
                          YOU
                        </span>
                      )}
                      {player.isHost && (
                        <span className="bg-amber-950 border border-amber-600 text-amber-300 text-[9px] font-mono px-1.5 py-0.2 rounded">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: roleInfo.color }}>
                      {roleInfo.title}
                    </div>
                  </div>
                </div>

                <div>
                  {player.isReady ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      READY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
                      WAITING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host / Ready Action Button */}
      <div className="w-full space-y-2">
        {isHost ? (
          <button
            type="button"
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-display font-black text-base tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2 border border-red-400"
          >
            <Play className="w-5 h-5 fill-white" />
            {playersList.length === 1 ? 'START SOLO DRILL' : 'LAUNCH WARP MISSION!'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleReady}
            className={`w-full py-3.5 px-6 rounded-2xl font-display font-black text-sm tracking-wider transition-all flex items-center justify-center gap-2 border ${
              myPlayer?.isReady
                ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {myPlayer?.isReady ? 'READY TO JUMP (CLICK TO UNREADY)' : 'ENGAGE CONSOLE (TOGGLE READY)'}
          </button>
        )}

        {isHost && playersList.length > 1 && !allReady && (
          <p className="text-center text-[10px] font-mono text-amber-400 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            You can launch at any time, but ensure all crewmates are ready!
          </p>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-900 border-2 border-cyan-500 rounded-2xl p-6 max-w-xs w-full text-center panel-bevel shadow-2xl">
            <h3 className="font-display font-black text-lg text-white mb-2">
              SCAN TO JOIN STATION
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Point any smartphone camera at this screen to join room <strong className="text-cyan-400">{roomState.code}</strong> instantly!
            </p>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Station QR Code"
                className="w-52 h-52 mx-auto rounded-xl border border-slate-700 p-2 bg-space-950 mb-3"
              />
            )}

            <div className="mb-4 bg-space-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300 select-all break-all">
              {getSharableUrl(roomState.code)}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-space-800 hover:bg-space-700 text-slate-200 font-mono text-xs font-bold border border-slate-600"
            >
              CLOSE QR TERMINAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
