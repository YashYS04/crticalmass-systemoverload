<div align="center">

# ⚡ CRITICAL MASS: SYSTEM OVERLOAD
### Distributed Real-Time Cooperative Crisis Game

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Orbitron&weight=800&size=26&duration=2500&pause=1000&color=06B6D4&center=true&vCenter=true&width=750&height=60&lines=CRITICAL+MASS%3A+SYSTEM+OVERLOAD;EMERGENCY+WARP+CORRIDOR+STABILIZATION;REAL-TIME+DISTRIBUTED+CO-OP+CHAOS;SCREAM+DIRECTIVES+TO+SURVIVE!)](https://git.io/typing-svg)

<p align="center">
  <img src="https://img.shields.io/badge/Real--Time-WebSockets-06b6d4?style=for-the-badge&logo=socket.io&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Language-TypeScript_5.4-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-f59e0b?style=for-the-badge" alt="Web Audio" />
</p>

<p align="center">
  <strong>No Logins &bull; No App Installs &bull; 4-Letter Room Codes &bull; QR Code Joining &bull; Phone & Laptop Crossplay</strong>
</p>

---

</div>

## 🌌 Overview

**Critical Mass: System Overload** is a high-octane, real-time cooperative multiplayer game. Players act as the emergency flight crew of an unstable starship navigating 5 dangerous warp sectors.

The catch? **Asymmetric Screen Derangement**. Directives appear on **your** screen, but the physical controls required to execute them are installed on **another crewmate's console**. The only way to survive is to scream commands out loud, manipulate tactile hardware before deadlines expire, and charge the warp drive before reactor meltdown!

---

## 🎮 Core Game Mechanics

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           THE DERANGEMENT MODEL                                 │
│                                                                                 │
│   [ Player 1: Ripley ]                               [ Player 2: Dallas ]       │
│   📱 Screen Displays:                                 📱 Screen Displays:       │
│   "CALIBRATE FLUX INDUCTOR TO 70%!"                  "ENGAGE NEUTRINO PURGE!"   │
│            │                                                  │                 │
│            │ (Must yell across room or voice call)            │                 │
│            ▼                                                  ▼                 │
│   [ Player 2's Physical Console ]                    [ Player 1's Physical Console ]   │
│   🎛️ Has the Flux Inductor Slider!                   🔘 Has the Neutrino Purge Button! │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Instant Room Access (Zero Friction)
* **No Account Required:** Players enter a call-sign, pick a helmet avatar, and create or join a station via a 4-letter alphanumeric code (e.g. `HYPR`, `WARP`).
* **Instant QR Code Joining:** Any phone can point its camera at the host's screen to join in seconds.
* **Solo Drill & Multi-Crew Support:** Plays seamlessly in **Solo Training Drill** (1 player) or up to **8+ players in full cooperative madness**.

### 2. Procedurally Generated Consoles
Consoles are never static. The procedural math engine allocates each crewmate a unique hardware layout based on a **100-point component budget**:
* **Analog Sliders:** Linear potentiometers with audio detents and calibrated units (`%`, `MW`, `PSI`, `kHz`).
* **Rotary Dials:** Angular stepped knobs (`STABLE`, `PRIMED`, `OVERDRIVE`, `VENT`).
* **Heavy Toggle Switches:** Industrial 2-way and 3-way aerospace switches (`OFF`, `AUX`, `MAX`).
* **Safety Cover Push Buttons:** Big red industrial actuators with spring-hinged protective covers.
* **High-Voltage Breakers:** Emergency knife switches with hazard stripes and heavy tactile clacks.
* **Cipher Keypads:** 3x3 numeric keypad terminals with retro LCD readouts.

### 3. Procedural Web Audio API Synthesizer
* Zero external MP3/WAV files—100% synthesized in real time via the native **Web Audio API**.
* Rich acoustic profile: tactile switch clacks, high-voltage breaker snaps, emergency sirens, hull damage explosions, warp surge sweeps, and victory fanfares.
* Mobile haptic feedback via `navigator.vibrate` on supported devices.

---

## 🏗️ Architecture & Engineering

```
                          ┌──────────────────────────────┐
                          │   Client (Phone / Laptop)    │
                          │  • React 18 + Vite           │
                          │  • Web Audio Synthesizer     │
                          │  • LocalStorage UUID Session │
                          └──────────────┬───────────────┘
                                         │  WebSockets (Socket.IO)
                                         ▼
                          ┌──────────────────────────────┐
                          │  Authoritative Game Server   │
                          │  • Strict FSM Action Filter  │
                          │  • 20Hz Core Game Loop       │
                          │  • Task Derangement Engine   │
                          │  • Dynamic Rebalance Guard   │
                          └──────────────────────────────┘
```

### 1. Strict State Machine (FSM) Action Filter
Prevents invalid transitions or race conditions by filtering client actions through state guards:
$$\text{LOBBY} \longrightarrow \text{STARTING (3s Countdown)} \longrightarrow \text{IN\_GAME} \longrightarrow \text{VICTORY} \;|\; \text{GAME\_OVER}$$
* Actions like `UPDATE_CONTROL` sent outside `IN_GAME` are rejected immediately.
* Ownership authorization guarantees clients can only manipulate hardware assigned to them.

### 2. The 20Hz Tick Engine
* **Fixed Timestep (50ms):** Evaluates active tasks, decrements deadlines, checks hull integrity, and integrates warp drive acceleration.
* **Exponential Task Decay:** Task deadlines dynamically shrink as sectors advance and combo streaks grow:
  $$T(\text{sector}, \text{combo}) = \max\left(5000\text{ms},\; 16000\text{ms} \cdot e^{-0.09 \cdot (\text{sector}-1)} - 200 \cdot \min(\text{combo}, 10)\right)$$

### 3. Disconnect Resilience & Dynamic Rebalancing
* **Session Continuity:** Session UUIDs cached in `localStorage` allow players to hot-reload back into their active console if their phone locks or browser refreshes.
* **30-Second Grace Period:** Mid-game disconnects freeze orphaned tasks temporarily.
* **Dynamic Hardware Rebalance:** If a player drops permanently, their physical controls are dynamically reallocated across surviving crewmates so missions remain 100% winnable.

---

## 📂 Project Directory Structure

```text
system-overload/
├── packages/
│   ├── shared/                # 🧠 Shared TypeScript contracts & algorithms
│   │   ├── src/types.ts       # RoomState, Task, Widget, ShipStatus schemas
│   │   ├── src/math.ts        # Derangement formulas, PRNG, decay curves
│   │   └── src/constants.ts   # Audio profiles, sci-fi vocabulary, roles
│   │
│   ├── server/                # ⚙️ Authoritative Node.js Server
│   │   ├── src/index.ts       # Express + Socket.IO entry & static delivery
│   │   ├── src/GameEngine.ts  # 20Hz loop, task evaluation, warp logic
│   │   └── src/RoomManager.ts # Lobbies, session UUIDs, disconnect grace
│   │
│   └── client/                # 📱 React 18 + Vite Mobile & Desktop UI
│       ├── src/App.tsx        # View orchestration & screen routing
│       ├── src/components/
│       │   ├── LobbyView.tsx          # Station creation, QR code, roster
│       │   ├── ShipStatusHUD.tsx      # Hull, warp spool, combo counter
│       │   ├── DirectiveBanner.tsx    # Communication alert & countdown bar
│       │   ├── ControlPanel.tsx       # Responsive tactile widget grid
│       │   ├── AudioSynth.ts          # Zero-dependency Web Audio synthesizer
│       │   └── widgets/               # Slider, Dial, Switch, Button, Breaker
│       └── src/hooks/useGameSocket.ts # WebSocket state sync & reconnects
│
└── test-e2e.js                # Automated multi-client integration test
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or later)
* **npm** (v9.0.0 or later)

### Installation
```bash
# Clone the repository
git clone https://github.com/YashYS04/crticalmass-systemoverload.git
cd crticalmass-systemoverload

# Install dependencies across all packages
npm install

# Build all packages (shared, client, server)
npm run build
```

### Running Locally
```bash
# Start the production server
npm start
```
The server will boot on port `3001` (or your configured `PORT`), serving both the API, real-time WebSockets, and the optimized frontend bundle.

Visit **`http://localhost:3001`** on your browser or open your machine's LAN IP (`http://<YOUR_LOCAL_IP>:3001`) from any phone connected to your Wi-Fi!

### Automated Testing
To run the automated multi-client integration test suite:
```bash
node test-e2e.js
```

---

## 🕹️ How to Play

1. **Host a Station:** Open the game and click **CREATE NEW STATION ROOM**.
2. **Invite Crewmates:** Have your friends scan the on-screen **QR Code** or type the **4-Letter Room Code** on their phones.
3. **Launch Mission:** Once everyone toggles **Ready**, the host clicks **LAUNCH WARP MISSION**.
4. **Communicate Loudly:** 
   * When an instruction appears in your banner, read it out loud immediately!
   * Listen for directives from other crewmates that match controls on your console.
   * Fulfill tasks before the countdown bar empties to prevent catastrophic hull breaches.
5. **Escape the Corridor:** Clear all 5 sectors to claim victory and view the squad MVP debrief!

---

<div align="center">
  <sub>Engineered with precision for real-time web gaming. Built with TypeScript, React 18, Socket.IO, and Web Audio.</sub>
</div>
