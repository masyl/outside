import { hasComponent, query, setComponent } from 'bitecs';
import {
  Acceleration,
  Deceleration,
  MaxSpeed,
  RunningSpeed,
  Speed,
  TargetPace,
  WalkingSpeed,
} from '../components';
import {
  TARGET_PACE_RUNNING,
  TARGET_PACE_RUNNING_FAST,
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  TARGET_PACE_WALKING_SLOW,
} from '../pace';
import type { SimulatorWorld } from '../world';

function desiredSpeedFromPace(eid: number): number {
  const pace = TargetPace.value[eid] ?? TARGET_PACE_STANDING_STILL;
  if (pace === TARGET_PACE_RUNNING) {
    return Math.max(0, RunningSpeed.tilesPerSec[eid] ?? 0);
  }
  if (pace === TARGET_PACE_RUNNING_FAST) {
    return Math.max(0, (WalkingSpeed.tilesPerSec[eid] ?? 0) * 2);
  }
  if (pace === TARGET_PACE_WALKING) {
    return Math.max(0, WalkingSpeed.tilesPerSec[eid] ?? 0);
  }
  if (pace === TARGET_PACE_WALKING_SLOW) {
    return Math.max(0, (WalkingSpeed.tilesPerSec[eid] ?? 0) * 0.5);
  }
  return 0;
}

/**
 * Centralized pace->speed conversion.
 * Behavior systems set TargetPace; this system is the only runtime writer of Speed.
 */
export function paceSystem(world: SimulatorWorld): SimulatorWorld {
  const eids = query(world, [
    Speed,
    TargetPace,
    WalkingSpeed,
    RunningSpeed,
    Acceleration,
    Deceleration,
  ]);
  const dtSec = Math.max(0.001, world.ticDurationMs / 1000);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const targetSpeed = desiredSpeedFromPace(eid);
    const currentSpeed = Math.max(0, Speed.tilesPerSec[eid] ?? 0);
    const accel = Math.max(0, Acceleration.tilesPerSec2[eid] ?? 0);
    const decel = Math.max(0, Deceleration.tilesPerSec2[eid] ?? 0);

    let nextSpeed = currentSpeed;
    if (targetSpeed > currentSpeed) {
      nextSpeed = Math.min(targetSpeed, currentSpeed + accel * dtSec);
    } else if (targetSpeed < currentSpeed) {
      nextSpeed = Math.max(targetSpeed, currentSpeed - decel * dtSec);
    }

    if (hasComponent(world, eid, MaxSpeed)) {
      const cap = Math.max(0, MaxSpeed.tilesPerSec[eid] ?? 0);
      nextSpeed = Math.min(nextSpeed, cap);
    }
    setComponent(world, eid, Speed, { tilesPerSec: nextSpeed });
  }

  return world;
}
