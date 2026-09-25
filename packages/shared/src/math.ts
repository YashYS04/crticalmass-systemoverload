import { GAME_CONSTANTS, SCI_FI_VOCABULARY } from './constants.js';
import { ControlWidget, Task, TaskUrgency, WidgetCategory, WidgetType } from './types.js';

export class SimplePRNG {
  private seed: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.seed = Math.abs(hash);
    } else {
      this.seed = Math.abs(seed);
    }
    if (this.seed === 0) this.seed = 123456789;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export function generateSciFiName(prng: SimplePRNG): { name: string; category: WidgetCategory } {
  const prefix = prng.pick(SCI_FI_VOCABULARY.prefixes);
  const noun = prng.pick(SCI_FI_VOCABULARY.nouns);
  const category = prng.pick(SCI_FI_VOCABULARY.categories);
  const idNumber = prng.range(1, 9);
  return {
    name: `${prefix} ${noun} ${idNumber}`,
    category,
  };
}

export const WIDGET_COSTS: Record<WidgetType, number> = {
  BUTTON: 15,
  SWITCH: 15,
  SLIDER: 20,
  DIAL: 25,
  BREAKER: 25,
  KEYPAD: 30,
};

export function generateWidgetsForPlayer(playerId: string, prng: SimplePRNG): ControlWidget[] {
  let budget = GAME_CONSTANTS.WIDGET_BUDGET_PER_PLAYER;
  const widgets: ControlWidget[] = [];
  const widgetTypes: WidgetType[] = ['BUTTON', 'SWITCH', 'SLIDER', 'DIAL', 'BREAKER', 'KEYPAD'];
  let index = 1;

  while (budget >= 15 && widgets.length < 6) {
    // Pick affordable type
    const affordable = widgetTypes.filter(t => WIDGET_COSTS[t] <= budget);
    if (affordable.length === 0) break;

    const chosenType = prng.pick(affordable);
    budget -= WIDGET_COSTS[chosenType];

    const { name, category } = generateSciFiName(prng);
    const widgetId = `w_${playerId.slice(0, 4)}_${index++}`;

    let config = {};
    let initialValue: number | boolean | string = 0;

    switch (chosenType) {
      case 'BUTTON':
        config = { requiresConfirmation: prng.next() > 0.65 };
        initialValue = false;
        break;
      case 'SWITCH': {
        const isThreeWay = prng.next() > 0.5;
        if (isThreeWay) {
          config = { options: ['OFF', 'AUX', 'MAX'] };
          initialValue = 'OFF';
        } else {
          config = { options: ['OFF', 'ENGAGED'] };
          initialValue = 'OFF';
        }
        break;
      }
      case 'SLIDER': {
        const units = ['%', 'MW', 'PSI', 'kHz', 'kPA'];
        config = {
          min: 0,
          max: 100,
          step: 10,
          unit: prng.pick(units),
        };
        initialValue = prng.range(0, 5) * 10;
        break;
      }
      case 'DIAL': {
        const dialOptions = ['STABLE', 'PRIMED', 'OVERDRIVE', 'VENT'];
        config = { options: dialOptions };
        initialValue = dialOptions[0];
        break;
      }
      case 'BREAKER':
        config = { requiresConfirmation: true };
        initialValue = 'NORMAL';
        break;
      case 'KEYPAD': {
        const seq = `${prng.range(1, 9)}${prng.range(1, 9)}${prng.range(1, 9)}`;
        config = { codeSequence: seq };
        initialValue = '---';
        break;
      }
    }

    widgets.push({
      id: widgetId,
      ownerPlayerId: playerId,
      type: chosenType,
      label: name,
      category,
      currentValue: initialValue,
      config,
    });
  }

  return widgets;
}

/**
 * Derangement task target formula:
 * Selects a recipient player such that recipient != owner (unless only 1 player is active).
 */
export function selectTaskRecipient(
  ownerPlayerId: string,
  allPlayerIds: string[],
  prng: SimplePRNG
): string {
  if (allPlayerIds.length <= 1) {
    return ownerPlayerId;
  }
  const otherPlayers = allPlayerIds.filter(id => id !== ownerPlayerId);
  return prng.pick(otherPlayers);
}

/**
 * Calculates dynamic task duration based on sector and combo streak.
 * Uses Exponential Decay: T(sector) = max(T_min, T_base * e^(-k * sector))
 */
export function calculateTaskDuration(sector: number, comboStreak: number): number {
  const k = 0.09;
  const base = GAME_CONSTANTS.BASE_TASK_DURATION_MS;
  const decayed = base * Math.exp(-k * (sector - 1));
  const comboReduction = Math.min(comboStreak, 10) * 200;
  const duration = Math.max(GAME_CONSTANTS.MIN_TASK_DURATION_MS, decayed - comboReduction);
  return Math.round(duration);
}

/**
 * Calculates ship damage on task failure.
 */
export function calculateFailureDamage(sector: number, urgency: TaskUrgency): number {
  const base = 12;
  const sectorScale = 1 + (sector - 1) * 0.15;
  const urgencyMultiplier = urgency === 'CATASTROPHIC' ? 2.0 : urgency === 'CRITICAL' ? 1.4 : 1.0;
  return Math.round(base * sectorScale * urgencyMultiplier);
}

/**
 * Generates an active task for a specific target widget.
 */
export function createDirectiveForWidget(
  widget: ControlWidget,
  recipientPlayerId: string,
  sector: number,
  comboStreak: number,
  prng: SimplePRNG
): Task {
  const now = Date.now();
  const durationMs = calculateTaskDuration(sector, comboStreak);
  const urgency: TaskUrgency = durationMs < 8000 ? 'CATASTROPHIC' : durationMs < 12000 ? 'CRITICAL' : 'NORMAL';

  let requiredValue: number | boolean | string = true;
  let displayValue = '';
  let instruction = '';

  switch (widget.type) {
    case 'BUTTON':
      requiredValue = true;
      displayValue = 'PRESSED';
      instruction = `DEPRESS THE ${widget.label.toUpperCase()}!`;
      break;

    case 'SWITCH': {
      const opts = widget.config.options || ['OFF', 'ENGAGED'];
      const current = widget.currentValue as string;
      const validTargets = opts.filter(o => o !== current);
      const chosen = prng.pick(validTargets.length > 0 ? validTargets : opts);
      requiredValue = chosen;
      displayValue = chosen;
      instruction = `SWITCH ${widget.label.toUpperCase()} TO [${chosen}]!`;
      break;
    }

    case 'SLIDER': {
      const step = widget.config.step || 10;
      const max = widget.config.max || 100;
      const targetPercent = prng.range(1, max / step) * step;
      requiredValue = targetPercent;
      displayValue = `${targetPercent}${widget.config.unit || '%'}`;
      instruction = `CALIBRATE ${widget.label.toUpperCase()} TO ${displayValue}!`;
      break;
    }

    case 'DIAL': {
      const opts = widget.config.options || ['STABLE', 'PRIMED', 'OVERDRIVE', 'VENT'];
      const current = widget.currentValue as string;
      const validTargets = opts.filter(o => o !== current);
      const chosen = prng.pick(validTargets.length > 0 ? validTargets : opts);
      requiredValue = chosen;
      displayValue = chosen;
      instruction = `ROTATE ${widget.label.toUpperCase()} TO [${chosen}]!`;
      break;
    }

    case 'BREAKER': {
      const target = widget.currentValue === 'NORMAL' ? 'TRIPPED' : 'NORMAL';
      requiredValue = target;
      displayValue = target;
      instruction = target === 'TRIPPED' 
        ? `TRIP EMERGENCY ${widget.label.toUpperCase()}!` 
        : `RESET ${widget.label.toUpperCase()}!`;
      break;
    }

    case 'KEYPAD': {
      const seq = `${prng.range(1, 9)}${prng.range(1, 9)}${prng.range(1, 9)}`;
      requiredValue = seq;
      displayValue = seq;
      instruction = `INPUT CODE [${seq}] INTO ${widget.label.toUpperCase()}!`;
      break;
    }
  }

  return {
    id: `t_${prng.range(100000, 999999)}`,
    instruction,
    recipientPlayerId,
    targetControlId: widget.id,
    targetOwnerPlayerId: widget.ownerPlayerId,
    requiredValue,
    displayValue,
    createdAt: now,
    durationMs,
    deadline: now + durationMs,
    status: 'ACTIVE',
    urgency,
    points: 100 + sector * 25 + (urgency === 'CATASTROPHIC' ? 100 : 0),
  };
}
