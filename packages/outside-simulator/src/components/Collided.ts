/**
 * Cooldown after collision (obstacle or entity–entity).
 * When ticksRemaining > 0, obstacle system skips response if moving away from wall;
 * entity–entity skips if both have cooldown and are moving away from each other.
 * Decremented every tic; set to OBSTACLE_CHECK_INTERVAL (4) when collision is applied.
 */
const Collided = {
  ticksRemaining: [] as number[],
};
export default Collided;
