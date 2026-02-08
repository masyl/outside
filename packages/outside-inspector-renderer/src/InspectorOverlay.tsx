import React, { type ReactNode } from 'react';

export interface InspectorOverlayProps {
  visible: boolean;
  pointerEvents?: 'none' | 'auto';
  children: ReactNode;
}

/**
 * Absolute overlay wrapper used to place inspector output over Pixi canvases.
 */
export function InspectorOverlay({
  visible,
  pointerEvents = 'none',
  children,
}: InspectorOverlayProps) {
  return (
    <div
      className="outside-inspector-overlay"
      data-inspector-overlay="true"
      data-visible={visible ? 'true' : 'false'}
      aria-label="Inspector overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents,
        display: visible ? 'block' : 'none',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
