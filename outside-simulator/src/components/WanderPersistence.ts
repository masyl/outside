/**
 * Tics until next direction/speed change for Wander urge.
 * When > 0, urge system keeps current direction/speed; when 0, picks new and sets 1–3 s.
 */
const WanderPersistence = {
  ticsUntilNextChange: [] as number[],
};
export default WanderPersistence;
