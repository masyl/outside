/** Target pace enum values stored in TargetPace.value. */
export const TARGET_PACE_STANDING_STILL = 0;
export const TARGET_PACE_WALKING = 1;
export const TARGET_PACE_RUNNING = 2;

export type TargetPaceValue =
  | typeof TARGET_PACE_STANDING_STILL
  | typeof TARGET_PACE_WALKING
  | typeof TARGET_PACE_RUNNING;
