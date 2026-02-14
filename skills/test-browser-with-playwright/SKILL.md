---
name: test-browser-with-playwright – Ȯ
description: Use this skill when you need to verify that code running in a browser actually works. Write and run Playwright tests to test Storybook stories, interactive features, and browser-side behavior without manual intervention.
---

# Test Browser Results with Playwright – Ȯ

## Use this skill when
- You've written code that runs in a browser (React components, interactive features, renderers).
- You need to verify the code actually works, not just that it compiles.
- Manual browser testing is not practical or reproducible.
- You want real, automated validation of browser behavior.

## Non-negotiable rules
1. **Always write tests instead of guessing.** Do not assume "it works" because the code compiled.
2. **Tests must verify actual behavior.** Check that elements are visible, text content is correct, state updates happen.
3. **Tests must be reproducible.** Use deterministic Storybook story IDs and fixed wait times.
4. **Run tests locally.** Use `pnpm test:playwright` or similar command to execute tests.
5. **Interpret test results carefully.** A passing test means the feature works; a failing test means the code is broken.

## Standard workflow (always follow)

### 1) Identify what to test
- What element should appear?
- What text/content should it contain?
- What interactions should happen?
- How long should you wait for things to load?

### 2) Find the story ID
- Navigate Storybook UI or examine `packages/outside-storybook/src/stories/*.stories.tsx`
- Extract the story path and construct the iframe URL: `/iframe.html?id=arcade-minimal-arena--minimal-arena`

### 3) Write the test
- Create a new `.spec.ts` file in `packages/outside-storybook/tests/`
- Use Playwright selectors to find elements
- Assert visibility, text content, and behavior
- Use realistic wait times (`waitForTimeout`, `waitForVisible`)

### 4) Run the test
- Execute: `pnpm --filter outside-storybook test:playwright`
- Interpret results:
  - **Pass**: Feature works as expected.
  - **Fail**: Code is broken or test expectations are wrong.

### 5) Iterate
- If test fails, fix the code or the test.
- Re-run until test passes.
- Commit both code and test together.

## Playwright patterns for Storybook

### Loading a story
```typescript
await page.goto(`/iframe.html?id=arcade-minimal-arena--minimal-arena`, { waitUntil: 'networkidle' });
```

### Finding elements
```typescript
// By text content
await page.locator('text=Entities:').isVisible();

// By role
await page.locator('button[role="button"]').click();

// By CSS selector
const div = page.locator('div[style*="position: absolute"]');
```

### Asserting visibility and content
```typescript
// Wait for element to appear
await expect(locator).toBeVisible();

// Check text content
const text = await locator.textContent();
expect(text).toContain('Entities: 42');

// Check specific number range
const count = parseInt(text.replace('Entities: ', ''), 10);
expect(count).toBeGreaterThan(0);
```

### Waiting and polling
```typescript
// Wait for text to change (e.g., async state updates)
await expect(locator).toContainText('Entities: 50', { timeout: 5000 });

// Explicit wait for state change
await page.waitForTimeout(1000); // 1 second
const newText = await locator.textContent();
```

### Evaluating JavaScript
```typescript
// Extract complex data from page
const canvas = page.locator('canvas');
const size = await canvas.evaluate((node) => ({
  width: (node as HTMLCanvasElement).width,
}));
expect(size.width).toBeGreaterThan(0);
```

## Configuration and setup

### playwright.config.ts location
`packages/outside-storybook/playwright.config.ts`

### Default test directory
`packages/outside-storybook/tests/`

### Running tests
```bash
# Run all Playwright tests
pnpm --filter outside-storybook test:playwright

# Run specific test file
pnpm --filter outside-storybook test:playwright entity-count

# Run with UI (headful)
PLAYWRIGHT_HEADLESS=false pnpm --filter outside-storybook test:playwright
```

## Common test patterns in this project

### Pattern 1: Verify element visibility
```typescript
test('entity count is visible', async ({ page }) => {
  await page.goto(`/iframe.html?id=arcade-minimal-arena--minimal-arena`, { waitUntil: 'networkidle' });

  const entityCounter = page.locator('text=Entities:');
  await expect(entityCounter).toBeVisible();
});
```

### Pattern 2: Verify content and values
```typescript
test('entity count displays a number', async ({ page }) => {
  await page.goto(`/iframe.html?id=arcade-minimal-arena--minimal-arena`, { waitUntil: 'networkidle' });

  const entityCounter = page.locator('div', { has: page.locator('text=Entities:') });
  const text = await entityCounter.textContent();

  expect(text).toMatch(/Entities: \d+/);
  const count = parseInt(text.replace('Entities: ', ''), 10);
  expect(count).toBeGreaterThan(0);
});
```

### Pattern 3: Verify dynamic updates
```typescript
test('entity count updates over time', async ({ page }) => {
  await page.goto(`/iframe.html?id=arcade-minimal-arena--minimal-arena`, { waitUntil: 'networkidle' });

  const entityCounter = page.locator('div:has-text("Entities:")');
  const initial = await entityCounter.textContent();
  const initialCount = parseInt(initial.replace('Entities: ', ''), 10);

  // Wait for update (500ms polling interval in code)
  await page.waitForTimeout(1500);

  const updated = await entityCounter.textContent();
  const updatedCount = parseInt(updated.replace('Entities: ', ''), 10);

  // Count should be non-zero and positive
  expect(updatedCount).toBeGreaterThan(0);
});
```

## Anti-patterns to avoid
- Writing tests that pass without actually checking the feature works.
- Using overly long timeouts (5000ms+) without checking why the page is slow.
- Assuming elements exist without verifying visibility.
- Not running tests locally before committing.
- Ignoring test failures and moving on.

## Communication style for this skill
- Report test results directly: "✓ passed" or "✗ failed".
- When tests fail, explain which assertion failed and why.
- Always run tests before claiming a feature is "done".
- If tests take too long, investigate performance instead of increasing timeout.
