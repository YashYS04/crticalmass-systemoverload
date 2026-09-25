import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './RoomManager.js';
import { 
  ClientToServerEvents, 
  CreateRoomPayload, 
  JoinRoomPayload, 
  ReconnectPayload, 
  ServerToClientEvents, 
  UpdateControlPayload 
} from '@system-overload/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import os from 'os';

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager(io);

// Network info endpoint for QR codes and multi-device connection
app.get('/api/network-info', (req, res) => {
  res.json({
    localIp: getLocalIp(),
    port: process.env.PORT || 3001,
    publicUrl: process.env.PUBLIC_URL || null,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now() });
});

// Serve frontend static build if it exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('<h1>Critical Mass: System Overload Game Server</h1><p>Client build not found or running in dev mode.</p>');
    }
  });
});

io.on('connection', (socket) => {
  // 1. Create Room
  socket.on('CREATE_ROOM', (payload: CreateRoomPayload, callback) => {
    try {
      const result = roomManager.createRoom(socket, payload);
      callback(result);
    } catch (err: any) {
      console.error('Error creating room:', err);
      callback({ success: false, error: err.message || 'Internal server error creating room.' });
    }
  });

  // 2. Join Room
  socket.on('JOIN_ROOM', (payload: JoinRoomPayload, callback) => {
    try {
      const result = roomManager.joinRoom(socket, payload);
      callback(result);
    } catch (err: any) {
      console.error('Error joining room:', err);
      callback({ success: false, error: err.message || 'Internal server error joining room.' });
    }
  });

  // 3. Reconnect Session
  socket.on('RECONNECT_SESSION', (payload: ReconnectPayload, callback) => {
    try {
      const result = roomManager.reconnect(socket, payload);
      callback(result);
    } catch (err: any) {
      console.error('Error reconnecting session:', err);
      callback({ success: false, error: err.message || 'Error reconnecting session.' });
    }
  });

  // 4. Toggle Ready
  socket.on('TOGGLE_READY', () => {
    // Locate player and room
    for (const roomCode of socket.rooms) {
      const engine = roomManager.getRoom(roomCode);
      if (engine) {
        for (const player of engine.players.values()) {
          if (player.socketId === socket.id) {
            engine.toggleReady(player.id);
            engine.broadcastState();
            return;
          }
        }
      }
    }
  });

  // 5. Start Game
  socket.on('START_GAME', () => {
    for (const roomCode of socket.rooms) {
      const engine = roomManager.getRoom(roomCode);
      if (engine) {
        for (const player of engine.players.values()) {
          if (player.socketId === socket.id && player.isHost) {
            engine.startCountdown();
            return;
          }
        }
      }
    }
  });

  // 6. Action Filter Guard: Update Control
  socket.on('UPDATE_CONTROL', (payload: UpdateControlPayload) => {
    for (const roomCode of socket.rooms) {
      const engine = roomManager.getRoom(roomCode);
      if (engine) {
        for (const player of engine.players.values()) {
          if (player.socketId === socket.id) {
            engine.handleControlUpdate(player.id, payload);
            return;
          }
        }
      }
    }
  });

  // 7. Restart Game
  socket.on('RESTART_GAME', () => {
    for (const roomCode of socket.rooms) {
      const engine = roomManager.getRoom(roomCode);
      if (engine) {
        for (const player of engine.players.values()) {
          if (player.socketId === socket.id && player.isHost) {
            engine.restartGame();
            return;
          }
        }
      }
    }
  });

  // 8. Ping / Latency test
  socket.on('PING', (clientTime, callback) => {
    if (typeof callback === 'function') {
      callback(Date.now());
    }
  });

  // 9. Disconnect handling
  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`🚀 [SYSTEM OVERLOAD] Server active!`);
  console.log(`   💻 Local URL:    http://localhost:${PORT}`);
  console.log(`   📱 Wi-Fi/LAN:    http://${localIp}:${PORT}`);
  if (process.env.PUBLIC_URL) {
    console.log(`   🌐 Public URL:   ${process.env.PUBLIC_URL}`);
  }
});
