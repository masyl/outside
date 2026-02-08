import { expect, test } from '@playwright/test';

test('simulator ecs core default shows follow links and velocity arrows', async ({ page }) => {
  await page.goto('/iframe.html?id=simulator-ecs-core--default', { waitUntil: 'networkidle' });

  const simulatorSvg = page.locator('svg[viewBox="0 0 1600 1200"]');
  await expect(simulatorSvg).toBeVisible();

  const followLineCount = await simulatorSvg
    .locator('[data-inspector-layer="follow-links"] line')
    .count();
  expect(followLineCount).toBeGreaterThan(0);

  const vectorArrowCount = await simulatorSvg
    .locator('[data-inspector-layer="velocity-vectors"] polygon')
    .count();
  expect(vectorArrowCount).toBeGreaterThan(0);
});

test('pixi overlay default shows inspector follow links and velocity arrows', async ({ page }) => {
  await page.goto('/iframe.html?id=renderer-pixi-ecs--default&args=showInspectorOverlay:true', {
    waitUntil: 'networkidle',
  });

  await expect(page.locator('.outside-inspector-overlay svg')).toBeVisible();

  const followLineCount = await page
    .locator('.outside-inspector-overlay svg [data-inspector-layer="follow-links"] line')
    .count();
  expect(followLineCount).toBeGreaterThan(0);

  const vectorArrowCount = await page
    .locator('.outside-inspector-overlay svg [data-inspector-layer="velocity-vectors"] polygon')
    .count();
  expect(vectorArrowCount).toBeGreaterThan(0);
});
