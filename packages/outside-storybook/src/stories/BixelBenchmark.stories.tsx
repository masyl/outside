import type { Meta, StoryObj } from '@storybook/react'
import { BixelBenchmark } from '@outside/bixel'

const meta = {
  title: 'Graphics/Bixel Performance Benchmark',
  component: BixelBenchmark,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Performance benchmark comparing pixel-based vs bixel-based line drawing.
Generates random lines on a 16×16 grid and measures rendering time for both approaches.

**Measurements include:**
- Total time to render all lines
- Average time per line
- Performance comparison (speedup factor)

Use the slider to test with different numbers of lines (1,000 to 50,000).
        `,
      },
    },
  },
  argTypes: {
    lineCount: {
      control: { type: 'range', min: 1000, max: 50000, step: 1000 },
      description: 'Number of random lines to benchmark',
      table: { defaultValue: { summary: '5000' } },
    },
    canvasSize: {
      control: { type: 'number' },
      description: 'Canvas size in pixels (for reference)',
      table: { defaultValue: { summary: '250' } },
    },
    gridSize: {
      control: { type: 'number' },
      description: 'Grid size (width/height in units)',
      table: { defaultValue: { summary: '16' } },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BixelBenchmark>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default benchmark with 5,000 random lines
 */
export const Default: Story = {
  args: {
    lineCount: 5000,
    canvasSize: 250,
    gridSize: 16,
  },
}

/**
 * Light benchmark with 1,000 lines
 */
export const Light: Story = {
  args: {
    lineCount: 1000,
    canvasSize: 250,
    gridSize: 16,
  },
}

/**
 * Medium benchmark with 10,000 lines
 */
export const Medium: Story = {
  args: {
    lineCount: 10000,
    canvasSize: 250,
    gridSize: 16,
  },
}

/**
 * Heavy benchmark with 25,000 lines
 */
export const Heavy: Story = {
  args: {
    lineCount: 25000,
    canvasSize: 250,
    gridSize: 16,
  },
}

/**
 * Extreme benchmark with 50,000 lines
 */
export const Extreme: Story = {
  args: {
    lineCount: 50000,
    canvasSize: 250,
    gridSize: 16,
  },
}

/**
 * Interactive story - use the control slider to adjust line count in real-time
 */
export const Interactive: Story = {
  args: {
    lineCount: 5000,
    canvasSize: 250,
    gridSize: 16,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the "Line Count" slider control above to dynamically test with different numbers of lines.',
      },
    },
  },
}
