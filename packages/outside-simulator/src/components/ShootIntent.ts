/**
 * Shoot intent: set to 1 when the entity wants to fire its canon this tic.
 * Cleared by the canon system after processing. Used by the hero (R2 trigger).
 */
const ShootIntent = {
  value: [] as number[],
};
export default ShootIntent;
