import { useRef, useCallback, type ReactNode } from 'react';

export interface SimulatorViewportProps {
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** Zoom level (1 = default, >1 = zoom in, <1 = zoom out). */
  zoom?: number;
  children: ReactNode;
  onPointerMove?: (viewBoxX: number, viewBoxY: number) => void;
  onPointerLeave?: () => void;
  onPointerDown?: (viewBoxX: number, viewBoxY: number) => void;
  cursor?: string;
}

/**
 * Fullscreen flex container + SVG with viewBox. Optionally forwards pointer events in viewBox coordinates.
 */
export function SimulatorViewport({
  viewBoxWidth,
  viewBoxHeight,
  zoom = 1,
  children,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  cursor,
}: SimulatorViewportProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const clientToViewBox = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const pt = clientToViewBox(e.clientX, e.clientY);
      if (pt) onPointerMove?.(pt.x, pt.y);
    },
    [clientToViewBox, onPointerMove]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const pt = clientToViewBox(e.clientX, e.clientY);
      if (pt) onPointerDown?.(pt.x, pt.y);
    },
    [clientToViewBox, onPointerDown]
  );

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
        ref={svgRef}
        viewBox={(() => {
          const z = Math.max(0.1, zoom);
          const w = viewBoxWidth / z;
          const h = viewBoxHeight / z;
          const minX = viewBoxWidth / 2 - w / 2;
          const minY = viewBoxHeight / 2 - h / 2;
          return `${minX} ${minY} ${w} ${h}`;
        })()}
        preserveAspectRatio="xMidYMid meet"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: '1px solid #333',
          background: '#1a1a1a',
          cursor: cursor ?? 'default',
        }}
        onPointerMove={onPointerMove ? handlePointerMove : undefined}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown ? handlePointerDown : undefined}
      >
        {children}
      </svg>
    </div>
  );
}
