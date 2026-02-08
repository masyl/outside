import React, { type ReactNode } from 'react';

export interface InspectorOverlayProps {
  visible: boolean;
  opacity?: number;
  pointerEvents?: 'none' | 'auto';
  children: ReactNode;
}

/**
 * Absolute overlay wrapper used to place inspector output over Pixi canvases.
 */
export function InspectorOverlay({
  visible,
  opacity = 0.45,
  pointerEvents = 'none',
  children,
}: InspectorOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents,
        opacity,
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
