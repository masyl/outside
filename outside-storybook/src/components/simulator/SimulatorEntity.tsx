export interface SimulatorEntityProps {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
}

/**
 * Single SVG circle for one entity. Purely presentational; no simulator imports.
 */
export function SimulatorEntity({
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth = 2,
}: SimulatorEntityProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
