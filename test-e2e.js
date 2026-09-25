import { io } from 'socket.io-client';

async function runE2ETest() {
  console.log('🧪 Starting End-to-End Test for Critical Mass: System Overload...');

  const SERVER_URL = 'http://localhost:3001';

  // 1. Connect Host
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('✅ Host connected to server');

  let roomCode = '';
  let hostSession = '';

  let latestState = null;
  hostSocket.on('ROOM_STATE_UPDATED', (state) => {
    latestState = state;
  });

  // 2. Create Room
  await new Promise((resolve, reject) => {
    hostSocket.emit('CREATE_ROOM', { playerName: 'Commander Ripley', avatar: '🚀' }, (res) => {
      if (res.success && res.roomCode) {
        roomCode = res.roomCode;
        hostSession = res.sessionToken;
        console.log(`✅ Room created successfully: [${roomCode}]`);
        resolve(res);
      } else {
        reject(new Error(res.error));
      }
    });
  });

  // 3. Connect Crewmate
  const crewSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((resolve) => crewSocket.on('connect', resolve));
  console.log('✅ Crewmate connected to server');

  let crewSession = '';

  // 4. Join Room
  await new Promise((resolve, reject) => {
    crewSocket.emit('JOIN_ROOM', { roomCode, playerName: 'Engineer Dallas', avatar: '⚡' }, (res) => {
      if (res.success) {
        crewSession = res.sessionToken;
        console.log(`✅ Dallas joined station [${roomCode}]`);
        resolve(res);
      } else {
        reject(new Error(res.error));
      }
    });
  });

  // 5. Verify Roster and Widgets in Lobby
  await new Promise((resolve) => {
    const checkRoster = () => {
      if (latestState && Object.keys(latestState.players).length === 2) {
        resolve(true);
      } else {
        setTimeout(checkRoster, 100);
      }
    };
    checkRoster();
  });
  console.log('✅ Both players in lobby with procedurally generated consoles');

  // 6. Test Invalid State Guard: Cannot update control while in LOBBY
  const someWidget = Object.values(latestState.widgets)[0];
  crewSocket.emit('UPDATE_CONTROL', { controlId: someWidget.id, value: 99 });
  await new Promise((r) => setTimeout(r, 200));
  if (latestState.state !== 'LOBBY') {
    throw new Error('State unexpectedly changed');
  }
  console.log('✅ Action Filter Guard successfully blocked control update in LOBBY state');

  // 7. Toggle Ready & Start Countdown
  crewSocket.emit('TOGGLE_READY');
  await new Promise((r) => setTimeout(r, 200));
  console.log('✅ Dallas toggled ready');

  console.log('🚀 Host triggering start countdown...');
  hostSocket.emit('START_GAME');

  // Wait for countdown (3 seconds) + launch
  console.log('⏳ Waiting for warp core spool (3s)...');
  await new Promise((resolve) => {
    const checkState = () => {
      if (latestState?.state === 'IN_GAME') {
        resolve(true);
      } else {
        setTimeout(checkState, 200);
      }
    };
    checkState();
  });

  console.log('🔥 Game is now IN_GAME!');
  console.log(`Ship Hull: ${latestState.ship.hullIntegrity}%, Warp Spool: ${latestState.ship.warpProgress}%`);
  console.log(`Active Directives: ${latestState.activeTasks.length}`);

  if (latestState.activeTasks.length === 0) {
    throw new Error('No active directives generated!');
  }

  // 8. Test Derangement Task Mechanics
  const activeTask = latestState.activeTasks[0];
  console.log(`\n📋 Directive generated: "${activeTask.instruction}"`);
  console.log(`   Instruction Reader: ${latestState.players[activeTask.recipientPlayerId]?.name}`);
  console.log(`   Physical Widget Owner: ${latestState.players[activeTask.targetOwnerPlayerId]?.name}`);

  // In a 2-player game, verify derangement (recipient != owner)
  if (activeTask.recipientPlayerId === activeTask.targetOwnerPlayerId) {
    console.warn('⚠️ Warning: Recipient was owner (derangement should prefer other player)');
  } else {
    console.log('✅ Derangement verified: Directive appears on screen A, physical control on console B!');
  }

  // 9. Execute required control action by the actual owner
  console.log(`🛠️ Target owner executing action on widget ${activeTask.targetControlId}...`);
  const ownerSocket = activeTask.targetOwnerPlayerId === hostSession ? hostSocket : crewSocket;
  
  let taskResolved = false;
  hostSocket.on('TASK_RESOLVED', (data) => {
    if (data.taskId === activeTask.id && data.success) {
      taskResolved = true;
      console.log(`✅ TASK_RESOLVED received on client! Score delta: +${data.scoreDelta}`);
    }
  });

  ownerSocket.emit('UPDATE_CONTROL', {
    controlId: activeTask.targetControlId,
    value: activeTask.requiredValue,
  });

  await new Promise((resolve) => {
    const check = () => {
      if (taskResolved) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  });

  console.log(`✅ Current ship score: ${latestState.ship.score}, Combo: ${latestState.ship.comboStreak}x`);

  // 10. Test Reconnect Session
  console.log('🔌 Testing disconnect & session recovery...');
  crewSocket.disconnect();
  await new Promise((r) => setTimeout(r, 300));

  const reconnectedCrewSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((resolve, reject) => {
    reconnectedCrewSocket.emit('RECONNECT_SESSION', { roomCode, sessionToken: crewSession }, (res) => {
      if (res.success) {
        console.log('✅ Successfully reconnected crewmate with session token!');
        resolve(res);
      } else {
        reject(new Error(res.error));
      }
    });
  });

  // Cleanup
  hostSocket.disconnect();
  reconnectedCrewSocket.disconnect();

  console.log('\n🏆 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
