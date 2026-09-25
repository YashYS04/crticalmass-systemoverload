export type RoomState = 'LOBBY' | 'STARTING' | 'IN_GAME' | 'VICTORY' | 'GAME_OVER';

export type PlayerRole = 
  | 'COMMANDER' 
  | 'CHIEF_ENGINEER' 
  | 'WEAPONS_OFFICER' 
  | 'REACTOR_TECH' 
  | 'NAVIGATOR' 
  | 'COMM_OFFICER';

export interface Player {
  id: string; // Session UUID
  socketId: string;
  name: string;
  role: PlayerRole;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  isConnected: boolean;
  disconnectedAt?: number;
  score: number;
  tasksCompleted: number;
  tasksFailed: number;
  avatar: string;
}

export type WidgetType = 'SLIDER' | 'DIAL' | 'SWITCH' | 'BUTTON' | 'KEYPAD' | 'BREAKER';

export type WidgetCategory = 'PROPULSION' | 'REACTOR' | 'LIFE_SUPPORT' | 'DEFENSE' | 'SENSORS';

export interface WidgetConfig {
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for multi-state switches or dials
  requiresConfirmation?: boolean; // e.g. flip cover on big button
  unit?: string; // e.g. "GHz", "PSI", "MW", "%"
  codeSequence?: string; // for keypads
}

export interface ControlWidget {
  id: string;
  ownerPlayerId: string;
  type: WidgetType;
  label: string;
  category: WidgetCategory;
  currentValue: number | boolean | string;
  targetValue?: number | boolean | string;
  config: WidgetConfig;
}

export type TaskStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
export type TaskUrgency = 'NORMAL' | 'CRITICAL' | 'CATASTROPHIC';

export interface Task {
  id: string;
  instruction: string;
  recipientPlayerId: string; // Player who reads the instruction
  targetControlId: string;   // Control ID that must be changed
  targetOwnerPlayerId: string; // Player who owns that physical widget
  requiredValue: number | boolean | string;
  displayValue: string;
  createdAt: number;
  durationMs: number;
  deadline: number;
  status: TaskStatus;
  urgency: TaskUrgency;
  points: number;
}

export interface ShipStatus {
  hullIntegrity: number; // 0 - 100
  maxHull: number;
  warpProgress: number;  // 0 - 100
  warpChargeRate: number; // % per second
  overheatLevel: number; // 0 - 100
  sector: number;        // 1 - 5
  totalSectors: number;
  comboStreak: number;
  score: number;
  timeElapsedMs: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'WARP';
}

export interface RoomPublicState {
  code: string;
  state: RoomState;
  hostId: string;
  players: Record<string, Player>;
  widgets: Record<string, ControlWidget>;
  activeTasks: Task[];
  ship: ShipStatus;
  difficulty: number;
  recentLogs: GameLogEntry[];
  serverTime: number;
  countdownRemaining?: number;
}

export interface CreateRoomPayload {
  playerName: string;
  avatar: string;
  sessionToken?: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatar: string;
  sessionToken?: string;
}

export interface ReconnectPayload {
  roomCode: string;
  sessionToken: string;
}

export interface UpdateControlPayload {
  controlId: string;
  value: number | boolean | string;
}

export interface ClientToServerEvents {
  CREATE_ROOM: (payload: CreateRoomPayload, callback: (res: { success: boolean; roomCode?: string; sessionToken?: string; error?: string }) => void) => void;
  JOIN_ROOM: (payload: JoinRoomPayload, callback: (res: { success: boolean; roomCode?: string; sessionToken?: string; error?: string }) => void) => void;
  RECONNECT_SESSION: (payload: ReconnectPayload, callback: (res: { success: boolean; state?: RoomPublicState; error?: string }) => void) => void;
  TOGGLE_READY: () => void;
  START_GAME: () => void;
  UPDATE_CONTROL: (payload: UpdateControlPayload) => void;
  RESTART_GAME: () => void;
  PING: (clientTime: number, callback: (serverTime: number) => void) => void;
}

export interface ServerToClientEvents {
  ROOM_STATE_UPDATED: (state: RoomPublicState) => void;
  TASK_ASSIGNED: (task: Task) => void;
  TASK_RESOLVED: (data: { taskId: string; success: boolean; completedByName: string; scoreDelta: number }) => void;
  SHIP_DAMAGED: (data: { damage: number; currentHull: number; reason: string }) => void;
  WARP_LEAP: (data: { sector: number; message: string }) => void;
  SOUND_TRIGGER: (data: { sound: string; intensity?: number }) => void;
  SCREEN_SHAKE: (data: { intensity: number; durationMs: number }) => void;
  PLAYER_DISCONNECTED: (data: { playerId: string; name: string; gracePeriodSeconds: number }) => void;
  PLAYER_RECONNECTED: (data: { playerId: string; name: string }) => void;
  ERROR_MESSAGE: (data: { message: string }) => void;
}
