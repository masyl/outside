import type { ReactNode } from 'react';

export interface SimulatorViewportProps {
  viewBoxWidth: number;
  viewBoxHeight: number;
  children: ReactNode;
}

/**
 * Fullscreen flex container + SVG with viewBox. Renders children inside the SVG.
 * Purely presentational; no simulator imports.
 */
export function SimulatorViewport({
  viewBoxWidth,
  viewBoxHeight,
  children,
}: SimulatorViewportProps) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: '1px solid #333',
          background: '#1a1a1a',
        }}
      >
        {children}
      </svg>
    </div>
  );
}
