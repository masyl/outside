/**
 * Independent tics until next direction and speed changes for Wander urge.
 * Legacy `ticsUntilNextChange` is kept for backward compatibility with older snapshots.
 */
const WanderPersistence = {
  ticsUntilNextChange: [] as number[],
  ticsUntilDirectionChange: [] as number[],
  ticsUntilSpeedChange: [] as number[],
};
export default WanderPersistence;
