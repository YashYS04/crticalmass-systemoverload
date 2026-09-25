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

export function useGameSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  });
  const [screenShake, setScreenShake] = useState<{ active: boolean; intensity: number }>({ active: false, intensity: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastWarpMessage, setLastWarpMessage] = useState<string | null>(null);

  useEffect(() => {
    // Connect to server (uses VITE_SERVER_URL if deployed to Vercel, or current origin)
    const serverUrl = import.meta.env.VITE_SERVER_URL || undefined;
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
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

  return {
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
  };
}
