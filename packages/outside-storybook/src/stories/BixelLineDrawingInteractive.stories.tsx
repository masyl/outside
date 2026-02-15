import type { Meta, StoryObj } from '@storybook/react'
import { BixelLineDrawingInteractive } from '@outside/bixel'

const meta = {
  title: 'Graphics/Bixel Interactive Drawing',
  component: BixelLineDrawingInteractive,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Interactive bixel line drawing demo on a 16×16 tile grid.

**Features:**
- Click tiles to select start and end points
- Lines are automatically drawn using Bresenham's algorithm
- Drag the colored circles to modify line endpoints
- Points automatically snap to tile centers
- Click X button to delete individual lines
- Clear all lines with the "Clear All Lines" button

**Grid Details:**
- 16×16 tiles (256×256 pixels total)
- Each tile is 16×16 pixels
- Coordinates snap to the center of clicked tiles
- Lines are drawn at the tile (bixel) level

**Visual Feedback:**
- Yellow highlight: selected tile for drawing
- Blue highlight: current hovered tile
- Cyan/Red circles: line start/end points (drag to move)
- Cyan pixels: all pixels covered by the drawn lines
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BixelLineDrawingInteractive>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive canvas for drawing bixel lines on a tile grid
 */
export const Default: Story = {
  render: () => <BixelLineDrawingInteractive />,
}

/**
 * Start with the interactive demo ready for exploration
 */
export const Interactive: Story = {
  render: () => <BixelLineDrawingInteractive />,
  parameters: {
    docs: {
      description: {
        story: 'Click on tiles to draw lines. Drag endpoints to modify. Delete with the X button.',
      },
    },
  },
}
