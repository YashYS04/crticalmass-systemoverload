import { 
  CreateRoomPayload, 
  generateWidgetsForPlayer, 
  JoinRoomPayload, 
  Player, 
  PLAYER_ROLES, 
  PlayerRole, 
  ReconnectPayload, 
  SimplePRNG 
} from '@system-overload/shared';
import { Server, Socket } from 'socket.io';
import { GameEngine } from './GameEngine.js';

export class RoomManager {
  private io: Server;
  private rooms: Map<string, GameEngine> = new Map();
  // Map sessionToken -> { roomCode, playerId }
  private sessions: Map<string, { roomCode: string; playerId: string }> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(socket: Socket, payload: CreateRoomPayload): { success: boolean; roomCode?: string; sessionToken?: string; error?: string } {
    const roomCode = this.generateUniqueRoomCode();
    const sessionToken = payload.sessionToken || this.generateUUID();
    const playerId = sessionToken;

    const engine = new GameEngine(roomCode, playerId, this.io);

    const player: Player = {
      id: playerId,
      socketId: socket.id,
      name: payload.playerName.trim() || 'Commander',
      role: PLAYER_ROLES[0].role,
      isHost: true,
      isReady: true,
      isAlive: true,
      isConnected: true,
      score: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      avatar: payload.avatar || '🚀',
    };

    engine.addPlayer(player);

    // Procedurally generate control panel for this player
    const widgets = generateWidgetsForPlayer(playerId, engine.prng);
    widgets.forEach(w => engine.widgets.set(w.id, w));

    this.rooms.set(roomCode, engine);
    this.sessions.set(sessionToken, { roomCode, playerId });

    socket.join(roomCode);
    engine.broadcastState();

    return {
      success: true,
      roomCode,
      sessionToken,
    };
  }

  public joinRoom(socket: Socket, payload: JoinRoomPayload): { success: boolean; roomCode?: string; sessionToken?: string; error?: string } {
    const code = payload.roomCode.trim().toUpperCase();
    const engine = this.rooms.get(code);

    if (!engine) {
      return { success: false, error: `Station [${code}] not found. Check the room code.` };
    }

    if (engine.state !== 'LOBBY') {
      return { success: false, error: 'Mission already in progress. Reconnect if you were already aboard.' };
    }

    if (engine.players.size >= 8) {
      return { success: false, error: 'Ship crew capacity reached (8/8).' };
    }

    const sessionToken = payload.sessionToken || this.generateUUID();
    const playerId = sessionToken;

    // Pick role based on index
    const roleIndex = engine.players.size % PLAYER_ROLES.length;
    const role: PlayerRole = PLAYER_ROLES[roleIndex].role;

    const player: Player = {
      id: playerId,
      socketId: socket.id,
      name: payload.playerName.trim() || `Crewmate ${engine.players.size + 1}`,
      role,
      isHost: false,
      isReady: false,
      isAlive: true,
      isConnected: true,
      score: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      avatar: payload.avatar || '⚡',
    };

    engine.addPlayer(player);

    // Procedurally generate control widgets for this player
    const widgets = generateWidgetsForPlayer(playerId, engine.prng);
    widgets.forEach(w => engine.widgets.set(w.id, w));

    this.sessions.set(sessionToken, { roomCode: code, playerId });

    socket.join(code);
    engine.broadcastState();

    return {
      success: true,
      roomCode: code,
      sessionToken,
    };
  }

  public reconnect(socket: Socket, payload: ReconnectPayload): { success: boolean; state?: any; error?: string } {
    const session = this.sessions.get(payload.sessionToken);
    if (!session) {
      return { success: false, error: 'Session expired or invalid.' };
    }

    const engine = this.rooms.get(session.roomCode);
    if (!engine) {
      return { success: false, error: 'Room has disbanded.' };
    }

    const reconnected = engine.reconnectPlayer(session.playerId, socket.id);
    if (!reconnected) {
      return { success: false, error: 'Player record not found.' };
    }

    socket.join(session.roomCode);
    engine.broadcastState();

    return {
      success: true,
      state: engine.getPublicState(),
    };
  }

  public handleDisconnect(socketId: string) {
    for (const [code, engine] of this.rooms.entries()) {
      for (const player of engine.players.values()) {
        if (player.socketId === socketId) {
          engine.removePlayer(player.id);
          engine.broadcastState();

          // If room completely empty in lobby, delete room
          const anyConnected = Array.from(engine.players.values()).some(p => p.isConnected);
          if (!anyConnected && engine.state === 'LOBBY') {
            this.rooms.delete(code);
          }
          return;
        }
      }
    }
  }

  public getRoom(roomCode: string): GameEngine | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  private generateUniqueRoomCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O to prevent confusion
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  private generateUUID(): string {
    return 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
  }
}
