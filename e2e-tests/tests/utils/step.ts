import { test, type Page, type TestInfo } from '@playwright/test';

/**
 * Runs one named step of a test and attaches a screenshot of the page as it
 * looked immediately afterwards. Wrapping every action in `step()` gives the
 * HTML report (`npx playwright show-report`) a visual, step-by-step replay
 * of the test — not just a pass/fail on the final assertion — which makes a
 * failure's exact point of divergence obvious without re-running headed.
 */
export async function step(
  page: Page,
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>
): Promise<void> {
  await test.step(label, async () => {
    await action();
    const screenshot = await page.screenshot();
    await testInfo.attach(label, { body: screenshot, contentType: 'image/png' });
  });
}
