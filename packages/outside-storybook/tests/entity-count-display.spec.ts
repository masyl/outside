import { test, expect } from '@playwright/test';

const stories = [
  'arcade-minimal-arena--minimal-arena',
  'arcade-food-fight-dungeon--food-fight-dungeon',
];

for (const storyId of stories) {
  test(`entity count displays in ${storyId}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${storyId}`, { waitUntil: 'networkidle' });

    // Wait for story to fully load
    await page.waitForTimeout(2000);

    // Check for console errors
    page.on('console', (msg) => console.log(`Browser: ${msg.type()}: ${msg.text()}`));

    // Find the entity count display - look for any div with "Entities:" text
    const entityCountDisplay = page.locator('text=Entities:');

    // Verify it's visible
    await expect(entityCountDisplay).toBeVisible();

    // Verify it contains the expected format
    const text = await entityCountDisplay.textContent();
    expect(text).toMatch(/^Entities: \d+$/);

    // Extract and verify the count is a positive number
    const countMatch = text?.match(/Entities: (\d+)/);
    expect(countMatch).toBeTruthy();
    const count = parseInt(countMatch![1], 10);
    expect(count).toBeGreaterThan(0);
  });

  test(`entity count updates in ${storyId}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${storyId}`, { waitUntil: 'networkidle' });

    // Wait for story to fully load
    await page.waitForTimeout(2000);

    const entityCountDisplay = page.locator('text=Entities:');

    // Read initial count
    const initialText = await entityCountDisplay.textContent();
    const initialMatch = initialText?.match(/Entities: (\d+)/);
    expect(initialMatch).toBeTruthy();
    const initialCount = parseInt(initialMatch![1], 10);
    expect(initialCount).toBeGreaterThan(0);

    // Wait for update (entity count polls every 500ms)
    await page.waitForTimeout(1500);

    // Read updated count
    const updatedText = await entityCountDisplay.textContent();
    const updatedMatch = updatedText?.match(/Entities: (\d+)/);
    expect(updatedMatch).toBeTruthy();
    const updatedCount = parseInt(updatedMatch![1], 10);

    // Should be positive
    expect(updatedCount).toBeGreaterThan(0);
  });
}
