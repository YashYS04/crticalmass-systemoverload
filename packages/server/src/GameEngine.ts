import { 
  ControlWidget, 
  GameLogEntry, 
  Player, 
  RoomPublicState, 
  RoomState, 
  ShipStatus, 
  Task, 
  UpdateControlPayload 
} from '@system-overload/shared';
import { 
  calculateFailureDamage, 
  calculateTaskDuration, 
  createDirectiveForWidget, 
  selectTaskRecipient, 
  SimplePRNG 
} from '@system-overload/shared';
import { GAME_CONSTANTS } from '@system-overload/shared';
import { Server } from 'socket.io';

export class GameEngine {
  public roomCode: string;
  public state: RoomState = 'LOBBY';
  public hostId: string;
  public players: Map<string, Player> = new Map();
  public widgets: Map<string, ControlWidget> = new Map();
  public activeTasks: Map<string, Task> = new Map();
  public ship: ShipStatus;
  public recentLogs: GameLogEntry[] = [];
  public prng: SimplePRNG;
  
  private tickInterval: NodeJS.Timeout | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private countdownRemaining: number = 0;
  private lastTickTime: number = Date.now();
  private io: Server;

  constructor(roomCode: string, hostId: string, io: Server) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.io = io;
    this.prng = new SimplePRNG(`${roomCode}_${Date.now()}`);
    
    this.ship = {
      hullIntegrity: GAME_CONSTANTS.BASE_HULL,
      maxHull: GAME_CONSTANTS.BASE_HULL,
      warpProgress: 0,
      warpChargeRate: 1.2, // ~1.2% per second base
      overheatLevel: 0,
      sector: 1,
      totalSectors: GAME_CONSTANTS.TOTAL_SECTORS,
      comboStreak: 0,
      score: 0,
      timeElapsedMs: 0,
    };

    this.addLog('SYSTEM INITIALIZED. STANDING BY IN DOCKING BAY.', 'INFO');
  }

  public addLog(text: string, type: GameLogEntry['type']) {
    const entry: GameLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      text,
      type,
    };
    this.recentLogs.unshift(entry);
    if (this.recentLogs.length > 25) {
      this.recentLogs.pop();
    }
  }

  public addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.addLog(`CREW MEMBER [${player.name.toUpperCase()}] JOINED STATION`, 'INFO');
  }

  public removePlayer(playerId: string) {
    const p = this.players.get(playerId);
    if (!p) return;

    if (this.state === 'LOBBY') {
      this.players.delete(playerId);
      if (this.hostId === playerId && this.players.size > 0) {
        const nextHost = Array.from(this.players.values())[0];
        this.hostId = nextHost.id;
        nextHost.isHost = true;
      }
      this.addLog(`CREW MEMBER [${p.name.toUpperCase()}] DEPARTED`, 'INFO');
    } else {
      // In-game disconnect: start grace period
      p.isConnected = false;
      p.disconnectedAt = Date.now();
      this.addLog(`WARNING: SIGNAL LOST WITH [${p.name.toUpperCase()}]. 30S RECONNECT GRACE ACTIVE.`, 'WARNING');
      
      this.io.to(this.roomCode).emit('PLAYER_DISCONNECTED', {
        playerId: p.id,
        name: p.name,
        gracePeriodSeconds: 30,
      });
    }
  }

  public reconnectPlayer(playerId: string, newSocketId: string): boolean {
    const p = this.players.get(playerId);
    if (!p) return false;

    p.isConnected = true;
    p.socketId = newSocketId;
    p.disconnectedAt = undefined;
    this.addLog(`SIGNAL RESTORED: [${p.name.toUpperCase()}] BACK ONLINE`, 'SUCCESS');

    this.io.to(this.roomCode).emit('PLAYER_RECONNECTED', {
      playerId: p.id,
      name: p.name,
    });
    return true;
  }

  public toggleReady(playerId: string) {
    if (this.state !== 'LOBBY') return;
    const p = this.players.get(playerId);
    if (p) {
      p.isReady = !p.isReady;
    }
  }

  public startCountdown() {
    if (this.state !== 'LOBBY') return;
    if (this.players.size === 0) return;

    this.state = 'STARTING';
    this.countdownRemaining = GAME_CONSTANTS.START_COUNTDOWN_SECONDS;
    this.addLog('WARP CORE SPOOLING. LAUNCH IN 3 SECONDS...', 'WARNING');
    this.broadcastState();

    this.countdownTimer = setInterval(() => {
      this.countdownRemaining--;
      if (this.countdownRemaining <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.launchGame();
      } else {
        this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'BEEP', intensity: 1 });
        this.broadcastState();
      }
    }, 1000);
  }

  private launchGame() {
    this.state = 'IN_GAME';
    this.lastTickTime = Date.now();
    this.ship.hullIntegrity = 100;
    this.ship.warpProgress = 0;
    this.ship.sector = 1;
    this.ship.comboStreak = 0;
    this.ship.score = 0;
    this.ship.timeElapsedMs = 0;
    this.activeTasks.clear();

    this.addLog('WARP CORRIDOR BREACHED! SYSTEM OVERLOAD IMMINENT!', 'DANGER');
    this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'SIREN', intensity: 2 });
    this.io.to(this.roomCode).emit('SCREEN_SHAKE', { intensity: GAME_CONSTANTS.SHAKE_SMALL, durationMs: 600 });

    // Start 20Hz Tick Loop
    this.tickInterval = setInterval(() => {
      this.onTick();
    }, GAME_CONSTANTS.TICK_INTERVAL_MS);

    // Initial task generation
    this.ensureTaskQuota();
    this.broadcastState();
  }

  /**
   * Action Filter Guard: Validates that control changes only occur in valid state
   * and by authorized players.
   */
  public handleControlUpdate(playerId: string, payload: UpdateControlPayload) {
    if (this.state !== 'IN_GAME') {
      // Guard: Drop invalid packet
      return;
    }

    const widget = this.widgets.get(payload.controlId);
    if (!widget) return;

    // Check ownership or rebalanced ownership
    if (widget.ownerPlayerId !== playerId) {
      // Not allowed to toggle controls assigned to someone else
      return;
    }

    // Update state
    widget.currentValue = payload.value;

    // Check if this fulfills any active tasks
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (task.targetControlId === widget.id) {
        let isMatch = false;

        if (widget.type === 'BUTTON') {
          // Momentary button trigger
          if (payload.value === true) {
            isMatch = true;
            // reset momentary button
            setTimeout(() => {
              widget.currentValue = false;
            }, 300);
          }
        } else if (widget.type === 'SLIDER') {
          // Allow ±5 threshold on sliders
          const targetNum = Number(task.requiredValue);
          const currentNum = Number(payload.value);
          if (Math.abs(targetNum - currentNum) <= 5) {
            isMatch = true;
          }
        } else {
          // Exact match for switches, dials, keypads, breakers
          if (String(payload.value).trim().toUpperCase() === String(task.requiredValue).trim().toUpperCase()) {
            isMatch = true;
          }
        }

        if (isMatch) {
          this.resolveTask(taskId, true, playerId);
          break;
        }
      }
    }

    this.broadcastState();
  }

  private resolveTask(taskId: string, success: boolean, actorPlayerId?: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    const actor = actorPlayerId ? this.players.get(actorPlayerId) : null;
    const recipient = this.players.get(task.recipientPlayerId);

    if (success) {
      task.status = 'COMPLETED';
      const actorName = actor ? actor.name : 'Unknown';
      if (actor) {
        actor.score += task.points;
        actor.tasksCompleted++;
      }
      this.ship.score += task.points;
      this.ship.comboStreak++;
      // Warp boost
      this.ship.warpProgress = Math.min(100, this.ship.warpProgress + 3.5);

      this.addLog(`DIRECTIVE EXECUTED: [${task.instruction}] BY ${actorName}`, 'SUCCESS');

      this.io.to(this.roomCode).emit('TASK_RESOLVED', {
        taskId: task.id,
        success: true,
        completedByName: actorName,
        scoreDelta: task.points,
      });

      this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'SUCCESS', intensity: 1 });
    } else {
      task.status = 'FAILED';
      this.ship.comboStreak = 0;
      const damage = calculateFailureDamage(this.ship.sector, task.urgency);
      this.ship.hullIntegrity = Math.max(0, this.ship.hullIntegrity - damage);

      if (actor) {
        actor.tasksFailed++;
      }

      this.addLog(`CRITICAL FAILURE: [${task.instruction}] EXPIRED! -${damage}% HULL`, 'DANGER');

      this.io.to(this.roomCode).emit('SHIP_DAMAGED', {
        damage,
        currentHull: this.ship.hullIntegrity,
        reason: `Expired: ${task.instruction}`,
      });

      this.io.to(this.roomCode).emit('SCREEN_SHAKE', {
        intensity: task.urgency === 'CATASTROPHIC' ? GAME_CONSTANTS.SHAKE_HEAVY : GAME_CONSTANTS.SHAKE_SMALL,
        durationMs: 700,
      });

      this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'ALARM', intensity: 2 });

      if (this.ship.hullIntegrity <= 0) {
        this.triggerGameOver();
        return;
      }
    }

    this.activeTasks.delete(taskId);
    this.ensureTaskQuota();
  }

  private onTick() {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    this.ship.timeElapsedMs += dt * 1000;

    // Check task expiration
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (now >= task.deadline) {
        this.resolveTask(taskId, false);
      }
    }

    // Warp progress calculation
    if (this.state === 'IN_GAME') {
      const healthFactor = this.ship.hullIntegrity / 100;
      const comboBonus = 1 + Math.min(this.ship.comboStreak, 15) * 0.08;
      const warpGain = this.ship.warpChargeRate * healthFactor * comboBonus * dt;
      this.ship.warpProgress += warpGain;

      if (this.ship.warpProgress >= 100) {
        this.executeSectorJump();
      }

      // Check disconnected players dynamic rebalancing
      this.checkDynamicRebalancing(now);
    }

    this.broadcastState();
  }

  private executeSectorJump() {
    if (this.ship.sector < this.ship.totalSectors) {
      this.ship.sector++;
      this.ship.warpProgress = 0;
      // Hull repair bonus upon sector warp jump
      this.ship.hullIntegrity = Math.min(100, this.ship.hullIntegrity + 20);
      
      this.addLog(`WARP VECTOR ACHIEVED! ENTERING SECTOR ${this.ship.sector}/${this.ship.totalSectors}!`, 'WARP');
      
      this.io.to(this.roomCode).emit('WARP_LEAP', {
        sector: this.ship.sector,
        message: `WARP JUMP SUCCESSFUL! REPAIRED +20% HULL!`,
      });

      this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'WARP_JUMP', intensity: 3 });
      this.io.to(this.roomCode).emit('SCREEN_SHAKE', { intensity: GAME_CONSTANTS.SHAKE_HEAVY, durationMs: 1200 });

      // Clear old tasks for fresh sector rush
      this.activeTasks.clear();
      this.ensureTaskQuota();
    } else {
      // Victory!
      this.state = 'VICTORY';
      if (this.tickInterval) clearInterval(this.tickInterval);
      this.tickInterval = null;

      this.addLog(`MISSION ACCOMPLISHED! ALL 5 SECTORS CLEARED!`, 'SUCCESS');
      this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'VICTORY', intensity: 3 });
    }
  }

  private triggerGameOver() {
    this.state = 'GAME_OVER';
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;

    this.addLog(`CRITICAL SYSTEM COLLAPSE: VESSEL DESTROYED`, 'DANGER');
    this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'EXPLOSION', intensity: 3 });
    this.io.to(this.roomCode).emit('SCREEN_SHAKE', { intensity: 35, durationMs: 1500 });
  }

  public restartGame() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;

    this.state = 'LOBBY';
    this.activeTasks.clear();
    for (const p of this.players.values()) {
      p.isReady = false;
      p.score = 0;
      p.tasksCompleted = 0;
      p.tasksFailed = 0;
    }
    this.ship = {
      hullIntegrity: 100,
      maxHull: 100,
      warpProgress: 0,
      warpChargeRate: 1.2,
      overheatLevel: 0,
      sector: 1,
      totalSectors: 5,
      comboStreak: 0,
      score: 0,
      timeElapsedMs: 0,
    };
    this.addLog('SYSTEM REBOOTED. READY FOR NEXT MISSION.', 'INFO');
    this.broadcastState();
  }

  private ensureTaskQuota() {
    if (this.state !== 'IN_GAME') return;

    const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
    if (connectedPlayers.length === 0) return;

    // Target task count: Math.min(2 * count, 5)
    const targetQuota = Math.max(1, Math.min(connectedPlayers.length * 2, 6));

    while (this.activeTasks.size < targetQuota) {
      this.generateNewDirective(connectedPlayers);
    }
  }

  private generateNewDirective(connectedPlayers: Player[]) {
    // Pick an available widget owned by a connected player
    const availableWidgets = Array.from(this.widgets.values()).filter(w => {
      const owner = this.players.get(w.ownerPlayerId);
      return owner && owner.isConnected;
    });

    if (availableWidgets.length === 0) return;

    const chosenWidget = this.prng.pick(availableWidgets);
    const connectedPlayerIds = connectedPlayers.map(p => p.id);

    // Derangement logic: Instruction goes to another player's screen!
    const recipientId = selectTaskRecipient(chosenWidget.ownerPlayerId, connectedPlayerIds, this.prng);

    const task = createDirectiveForWidget(
      chosenWidget,
      recipientId,
      this.ship.sector,
      this.ship.comboStreak,
      this.prng
    );

    this.activeTasks.set(task.id, task);

    this.io.to(this.roomCode).emit('TASK_ASSIGNED', task);
    this.io.to(this.roomCode).emit('SOUND_TRIGGER', { sound: 'NEW_TASK', intensity: 1 });
  }

  /**
   * Disconnect Grace Period & Dynamic Rebalancing:
   * If a player disconnects for more than 30s, dynamically reassign their widgets
   * to surviving players so all controls stay operable.
   */
  private checkDynamicRebalancing(now: number) {
    const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
    if (connectedPlayers.length === 0) return;

    for (const player of this.players.values()) {
      if (!player.isConnected && player.disconnectedAt) {
        const timeOffline = now - player.disconnectedAt;
        if (timeOffline > GAME_CONSTANTS.GRACE_PERIOD_MS) {
          // Player timed out: rebalance their widgets
          const abandonedWidgets = Array.from(this.widgets.values()).filter(w => w.ownerPlayerId === player.id);
          if (abandonedWidgets.length > 0) {
            this.addLog(`DYNAMIC REBALANCE: CONTROLS OF [${player.name.toUpperCase()}] REALLOCATED TO CREW`, 'WARNING');
            abandonedWidgets.forEach((w, idx) => {
              const substitutePlayer = connectedPlayers[idx % connectedPlayers.length];
              w.ownerPlayerId = substitutePlayer.id;
            });
            player.disconnectedAt = undefined; // Mark as handled
          }
        }
      }
    }
  }

  public getPublicState(): RoomPublicState {
    const playersObj: Record<string, Player> = {};
    for (const [id, p] of this.players.entries()) {
      playersObj[id] = p;
    }

    const widgetsObj: Record<string, ControlWidget> = {};
    for (const [id, w] of this.widgets.entries()) {
      widgetsObj[id] = w;
    }

    return {
      code: this.roomCode,
      state: this.state,
      hostId: this.hostId,
      players: playersObj,
      widgets: widgetsObj,
      activeTasks: Array.from(this.activeTasks.values()),
      ship: { ...this.ship },
      difficulty: this.ship.sector,
      recentLogs: [...this.recentLogs],
      serverTime: Date.now(),
      countdownRemaining: this.countdownRemaining,
    };
  }

  public broadcastState() {
    this.io.to(this.roomCode).emit('ROOM_STATE_UPDATED', this.getPublicState());
  }
}
