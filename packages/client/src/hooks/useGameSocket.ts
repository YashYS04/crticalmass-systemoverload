import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  RoomPublicState, 
  ServerToClientEvents, 
  Task 
} from '@system-overload/shared';
import { audioSynth } from '../components/AudioSynth';

const SESSION_TOKEN_KEY = 'so_session_token';
const ROOM_CODE_KEY = 'so_room_code';
const PLAYER_NAME_KEY = 'so_player_name';

export const SERVER_URL_STORAGE_KEY = 'so_server_url';
export const DEFAULT_PUBLIC_BACKEND = 'https://surfing-voted-conclusions-elite.trycloudflare.com';

export function getResolvedServerUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  // 1. URL parameter override: ?server=https://...
  const params = new URLSearchParams(window.location.search);
  const serverParam = params.get('server');
  if (serverParam) {
    localStorage.setItem(SERVER_URL_STORAGE_KEY, serverParam);
    return serverParam;
  }

  // 2. Custom server URL from localStorage
  const saved = localStorage.getItem(SERVER_URL_STORAGE_KEY);
  if (saved) return saved;

  // 3. Vite environment variable from build
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  // 4. If running on Vercel, default to live backend tunnel
  if (window.location.hostname.includes('vercel.app')) {
    return DEFAULT_PUBLIC_BACKEND;
  }

  return undefined;
}

export function useGameSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeServerUrl, setActiveServerUrl] = useState<string | undefined>(getResolvedServerUrl);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  });
  const [screenShake, setScreenShake] = useState<{ active: boolean; intensity: number }>({ active: false, intensity: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastWarpMessage, setLastWarpMessage] = useState<string | null>(null);

  useEffect(() => {
    const serverUrl = getResolvedServerUrl();
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Try auto-reconnect if we have a saved token and room
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const savedRoom = localStorage.getItem(ROOM_CODE_KEY);
      if (savedToken && savedRoom) {
        socket.emit('RECONNECT_SESSION', { roomCode: savedRoom, sessionToken: savedToken }, (res) => {
          if (res.success && res.state) {
            setRoomState(res.state);
            setMyPlayerId(savedToken);
          } else {
            // Room likely expired
            localStorage.removeItem(ROOM_CODE_KEY);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('ROOM_STATE_UPDATED', (state) => {
      setRoomState(state);
    });

    socket.on('SOUND_TRIGGER', (data) => {
      audioSynth.playSound(data.sound, data.intensity || 1);
    });

    socket.on('SCREEN_SHAKE', (data) => {
      audioSynth.vibrate(data.durationMs > 1000 ? 200 : 80);
      setScreenShake({ active: true, intensity: data.intensity });
      setTimeout(() => {
        setScreenShake({ active: false, intensity: 0 });
      }, data.durationMs);
    });

    socket.on('WARP_LEAP', (data) => {
      setLastWarpMessage(data.message);
      setTimeout(() => setLastWarpMessage(null), 4000);
    });

    socket.on('ERROR_MESSAGE', (data) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string, avatar: string) => {
    if (!socketRef.current) return;
    const token = localStorage.getItem(SESSION_TOKEN_KEY) || undefined;
    socketRef.current.emit('CREATE_ROOM', { playerName, avatar, sessionToken: token }, (res) => {
      if (res.success && res.roomCode && res.sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, res.sessionToken);
        localStorage.setItem(ROOM_CODE_KEY, res.roomCode);
        localStorage.setItem(PLAYER_NAME_KEY, playerName);
        setMyPlayerId(res.sessionToken);
      } else {
        setErrorMessage(res.error || 'Failed to initialize station.');
      }
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string, avatar: string) => {
    if (!socketRef.current) return;
    const token = localStorage.getItem(SESSION_TOKEN_KEY) || undefined;
    socketRef.current.emit('JOIN_ROOM', { roomCode, playerName, avatar, sessionToken: token }, (res) => {
      if (res.success && res.roomCode && res.sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, res.sessionToken);
        localStorage.setItem(ROOM_CODE_KEY, res.roomCode);
        localStorage.setItem(PLAYER_NAME_KEY, playerName);
        setMyPlayerId(res.sessionToken);
      } else {
        setErrorMessage(res.error || 'Failed to dock with station.');
      }
    });
  }, []);

  const toggleReady = useCallback(() => {
    audioSynth.playSound('BUTTON');
    socketRef.current?.emit('TOGGLE_READY');
  }, []);

  const startGame = useCallback(() => {
    audioSynth.playSound('BUTTON');
    socketRef.current?.emit('START_GAME');
  }, []);

  const updateControl = useCallback((controlId: string, value: number | boolean | string) => {
    socketRef.current?.emit('UPDATE_CONTROL', { controlId, value });
  }, []);

  const restartGame = useCallback(() => {
    audioSynth.playSound('BUTTON');
    socketRef.current?.emit('RESTART_GAME');
  }, []);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(ROOM_CODE_KEY);
    setRoomState(null);
    window.location.reload();
  }, []);

  const updateServerUrl = useCallback((newUrl: string) => {
    const trimmed = newUrl.trim();
    if (trimmed) {
      localStorage.setItem(SERVER_URL_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(SERVER_URL_STORAGE_KEY);
    }
    setActiveServerUrl(trimmed || undefined);
    window.location.reload();
  }, []);

  return {
    isConnected,
    activeServerUrl,
    updateServerUrl,
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
  };
}
