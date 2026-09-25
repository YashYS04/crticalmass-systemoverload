import { PlayerRole, WidgetCategory } from './types.js';

export const GAME_CONSTANTS = {
  SERVER_TICK_RATE_HZ: 20, // 50ms per tick
  TICK_INTERVAL_MS: 50,
  GRACE_PERIOD_MS: 30000, // 30s reconnect grace period
  START_COUNTDOWN_SECONDS: 3,
  TOTAL_SECTORS: 5,
  BASE_HULL: 100,
  BASE_WARP_GOAL: 100,
  BASE_TASK_DURATION_MS: 16000,
  MIN_TASK_DURATION_MS: 5000,
  MAX_TASKS_PER_PLAYER: 2,
  WIDGET_BUDGET_PER_PLAYER: 100,
  SHAKE_SMALL: 8,
  SHAKE_HEAVY: 22,
};

export const PLAYER_ROLES: { role: PlayerRole; title: string; color: string; perk: string }[] = [
  { role: 'COMMANDER', title: 'Flight Commander', color: '#f59e0b', perk: 'Directs emergency overdrive protocols' },
  { role: 'CHIEF_ENGINEER', title: 'Chief Engineer', color: '#10b981', perk: 'Maintains sub-atomic coolant valves' },
  { role: 'WEAPONS_OFFICER', title: 'Tactical Officer', color: '#ef4444', perk: 'Monitors plasma grid dissipation' },
  { role: 'REACTOR_TECH', title: 'Reactor Technician', color: '#8b5cf6', perk: 'Calibrates antimatter containment' },
  { role: 'NAVIGATOR', title: 'Astro-Navigator', color: '#3b82f6', perk: 'Coordinates warp corridor alignment' },
  { role: 'COMM_OFFICER', title: 'Communications Specialist', color: '#ec4899', perk: 'Deciphers priority distress directives' },
];

export const SCI_FI_VOCABULARY = {
  prefixes: [
    'Quantum', 'Tachyon', 'Hyper', 'Flux', 'Grav-Jelly', 'Neutrino', 
    'Plasma', 'Antimatter', 'Sub-Space', 'Chrono', 'Dark-Matter', 
    'Ionic', 'Cryo', 'Positronic', 'Spectral', 'Baryon', 'Singularity'
  ],
  nouns: [
    'Inductor', 'Resonator', 'Manifold', 'Modulator', 'Purge Valve', 
    'Dampener', 'Capacitor', 'Conduit', 'Actuator', 'Relay', 
    'Matrix', 'Exciter', 'Separator', 'Breaker', 'Deflector', 'Siphon'
  ],
  categories: ['PROPULSION', 'REACTOR', 'LIFE_SUPPORT', 'DEFENSE', 'SENSORS'] as WidgetCategory[],
};
