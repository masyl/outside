export interface SimulatorCaptionProps {
  seed: number;
  entityCount: number;
  legend?: string;
}

const DEFAULT_LEGEND = 'Green = normal, Red = just collided';

/**
 * Footer caption with seed, entity count, and optional legend.
 * Purely presentational; no simulator imports.
 */
export function SimulatorCaption({
  seed,
  entityCount,
  legend = DEFAULT_LEGEND,
}: SimulatorCaptionProps) {
  return (
    <p
      style={{
        margin: 0,
        padding: 8,
        fontSize: 12,
        color: '#888',
        flexShrink: 0,
      }}
    >
      Seed: {seed} · Entities: {entityCount} · {legend}
    </p>
  );
}
