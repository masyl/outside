/**
 * React inspector renderer primitives shared by Storybook render diagnostics.
 */
export {
  createInspectorRenderWorld,
  applyInspectorStream,
  type RenderStreamPacket,
  type InspectorRenderWorld,
} from './render-stream';

export {
  buildInspectorFrame,
  type InspectorFrame,
  type InspectorTile,
  type InspectorEntity,
  type InspectorFollowLink,
  type InspectorTileKind,
  type InspectorEntityKind,
} from './frame';

export { InspectorRenderer } from './InspectorRenderer';
export type { InspectorRendererProps } from './InspectorRenderer';

export { InspectorOverlay } from './InspectorOverlay';
export { INSPECTOR_RENDERER_VERSION } from './version';
export type { InspectorOverlayProps } from './InspectorOverlay';

export { SimulatorViewport } from './components/SimulatorViewport';
export type { SimulatorViewportProps } from './components/SimulatorViewport';

export { SimulatorEntity } from './components/SimulatorEntity';
export type { SimulatorEntityProps } from './components/SimulatorEntity';

export { SimulatorCaption } from './components/SimulatorCaption';
export type { SimulatorCaptionProps } from './components/SimulatorCaption';

export { FloorTilesLayer } from './components/FloorTilesLayer';
export type {
  FloorTilesLayerProps,
  ViewTransform as FloorTilesViewTransform,
} from './components/FloorTilesLayer';

export { GridOverlay } from './components/GridOverlay';
export type {
  GridOverlayProps,
  ViewBounds,
  ViewTransform as GridViewTransform,
} from './components/GridOverlay';

export { InspectorPrimitivesLayer } from './components/InspectorPrimitivesLayer';
export type { InspectorPrimitivesLayerProps } from './components/InspectorPrimitivesLayer';
