/**
 * Per-entity deadline for reaching current wander destination.
 * Used to avoid destination thrashing while still allowing timeout-based retargeting.
 */
const DestinationDeadline = {
  ticsRemaining: [] as number[],
  pathTiles: [] as number[],
};
export default DestinationDeadline;
