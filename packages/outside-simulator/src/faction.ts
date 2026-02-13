/**
 * Faction constants and hostility helpers.
 * @packageDocumentation
 */

export const FACTION_NEUTRAL = 0;
export const FACTION_CAT = 1;
export const FACTION_DOG = 2;

/** Bitmask for HostileToFactions: cats are hostile to dogs. */
export const CAT_HOSTILE_MASK = 1 << FACTION_DOG; // 4
/** Bitmask for HostileToFactions: dogs are hostile to cats. */
export const DOG_HOSTILE_MASK = 1 << FACTION_CAT; // 2

/** Returns true if a shooter with the given mask is hostile to the target faction. */
export function isHostile(shooterMask: number, targetFaction: number): boolean {
  return (shooterMask & (1 << targetFaction)) !== 0;
}
