import type { Meta, StoryObj } from '@storybook/react'
import { BixelLineComparison, DEMO_LINES, type LineConfig } from '@outside/bixel'

const meta = {
  title: 'Graphics/Bixel Line Drawing',
  component: BixelLineComparison,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Reference implementation comparing pixel-based Bresenham's line algorithm
with bixel-based line drawing using 4bx units.

**Left side**: Classic Bresenham operating on pixel coordinates
**Right side**: Bixel-based Bresenham using 4×4 bixel blocks

Use the zoom control to scale the visualization. The bixel grid shows the
4×4 pixel blocks that make up each bixel unit.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BixelLineComparison>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default demo with 6 lines drawn at different angles
 */
export const Default: Story = {
  args: {
    lines: DEMO_LINES,
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * Higher zoom level (8x) for better pixel-level inspection
 */
export const HighZoom: Story = {
  args: {
    lines: DEMO_LINES,
    zoomMultiplier: 8,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * Lower zoom level (2x) to see the overall pattern
 */
export const LowZoom: Story = {
  args: {
    lines: DEMO_LINES,
    zoomMultiplier: 2,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * Simple horizontal line comparison
 */
export const HorizontalLine: Story = {
  args: {
    lines: [
      {
        name: 'Horizontal Line',
        start: { x: 1, y: 8 },
        end: { x: 15, y: 8 },
        color: '#FF6B6B',
      },
    ] as LineConfig[],
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * Vertical line comparison
 */
export const VerticalLine: Story = {
  args: {
    lines: [
      {
        name: 'Vertical Line',
        start: { x: 8, y: 1 },
        end: { x: 8, y: 15 },
        color: '#4ECDC4',
      },
    ] as LineConfig[],
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * 45-degree diagonal line comparison
 */
export const DiagonalLine: Story = {
  args: {
    lines: [
      {
        name: '45° Diagonal',
        start: { x: 1, y: 1 },
        end: { x: 15, y: 15 },
        color: '#FFE66D',
      },
    ] as LineConfig[],
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: true,
  },
}

/**
 * Multiple lines at various angles without bixel grid for cleaner view
 */
export const MinimalGrid: Story = {
  args: {
    lines: DEMO_LINES,
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: false,
  },
}

/**
 * Complex test case with lines of different slopes
 */
export const ComplexPattern: Story = {
  args: {
    lines: [
      { name: 'Line 1', start: { x: 0, y: 0 }, end: { x: 15, y: 8 }, color: '#FF6B6B' },
      { name: 'Line 2', start: { x: 15, y: 0 }, end: { x: 0, y: 8 }, color: '#4ECDC4' },
      { name: 'Line 3', start: { x: 8, y: 0 }, end: { x: 8, y: 15 }, color: '#FFE66D' },
      { name: 'Line 4', start: { x: 0, y: 8 }, end: { x: 15, y: 15 }, color: '#95E1D3' },
      { name: 'Line 5', start: { x: 0, y: 15 }, end: { x: 15, y: 0 }, color: '#F38181' },
      { name: 'Line 6', start: { x: 2, y: 2 }, end: { x: 13, y: 13 }, color: '#AA96DA' },
    ] as LineConfig[],
    zoomMultiplier: 4,
    gridSize: 16,
    showBixelGrid: true,
  },
}
