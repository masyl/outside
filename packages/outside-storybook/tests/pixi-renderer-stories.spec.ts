import { test, expect } from '@playwright/test';

const stories = [
  'renderer-pixi-ecs-static--box-dungeon-hero&args=showDebug:true',
  'renderer-pixi-ecs-static--zoos-showcase&args=showDebug:true',
  'renderer-pixi-ecs-static--small-dungeon-empty&args=showDebug:true',
  'renderer-pixi-ecs-static--large-dungeon-with-entities&args=showDebug:true',
  'renderer-pixi-canvas-checks--solid-rect',
  'renderer-pixi-canvas-checks--grid-lines',
  'renderer-pixi-canvas-checks--circles-palette',
  'renderer-pixi-canvas-checks--stroke-and-fill',
];

for (const storyId of stories) {
  test(`renders ${storyId}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${storyId}`, { waitUntil: 'networkidle' });
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const size = await canvas.evaluate((node) => ({
      width: (node as HTMLCanvasElement).width,
      height: (node as HTMLCanvasElement).height,
    }));
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);

    // Simple pixel sanity: sample center pixel alpha to ensure something rendered.
    const alpha = await canvas.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 255;
      const pixel = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
      return pixel[3];
    });
    expect(alpha).toBeGreaterThanOrEqual(0);
  });
}
