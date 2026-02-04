export interface SimulatorCaptionProps {
  seed: number;
  entityCount: number;
  legend?: string;
  /** When true, caption overlays at bottom without taking layout space (full viewport for sim). */
  overlay?: boolean;
}

const DEFAULT_LEGEND = 'Green = normal, Red = just collided';

/**
 * Caption with seed, entity count, and optional legend.
 * Purely presentational; no simulator imports.
 * Use overlay=true to avoid taking space and prevent scrollbars.
 */
export function SimulatorCaption({
  seed,
  entityCount,
  legend = DEFAULT_LEGEND,
  overlay = true,
}: SimulatorCaptionProps) {
  return (
    <p
      style={{
        margin: 0,
        padding: overlay ? '6px 8px' : 8,
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        flexShrink: 0,
        ...(overlay && {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
        }),
      }}
    >
      Seed: {seed} · Entities: {entityCount} · {legend}
    </p>
  );
}
