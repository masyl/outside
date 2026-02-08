/**
 * React inspector renderer primitives shared by Storybook render diagnostics.
 */
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
