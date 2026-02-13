/**
 * Bitmask of factions this entity shoots at.
 * Bit 0 (1) = neutral, bit 1 (2) = cat, bit 2 (4) = dog.
 * E.g. a cat hostile to dogs: mask = 4.
 */
const HostileToFactions = {
  mask: [] as number[],
};
export default HostileToFactions;
