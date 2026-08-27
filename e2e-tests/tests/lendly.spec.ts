import { test, expect } from '@playwright/test';
import { step } from './utils/step';

test.beforeEach(async ({ page }) => {
  // Block ads so the test never depends on real third-party hosts.
  await page.route('**pagead2.googlesyndication.com/**', (route) => route.abort());
});

// Smoke test: Lendly's whole point is "add a thing, lend it to someone, see
// it come back on Home" - so this walks that exact path across all three
// tabs rather than checking any one screen in isolation. Each screen starts
// empty (fresh AsyncStorage per test), so the empty states double as proof
// the add/lend actions are what actually populated everything afterwards.
//
// The tab bar renders as real <a> links (expo-router/ui), so those are
// targeted by role. Everything else - sheet-modal titles, form submit
// buttons, item picker chips - renders as plain unstyled-role divs via
// react-native-web, some sharing exact text with a modal's own title (e.g.
// "Add item" is both the AddItemModal's heading and its submit button), so
// those are targeted with `.last()`: in every case here the interactive
// control is the last DOM match for its text, since the title always
// precedes the form content that contains it.
test('adding an item and lending it shows up as an active loan on Home', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Load the app on an empty Home tab', async () => {
    await page.goto('/');
    await expect(page.getByText('Lendly', { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Nothing's out right now.")).toBeVisible();
  });

  await step(page, testInfo, 'Go to Items and add "Cordless drill"', async () => {
    await page.getByRole('link', { name: 'Items' }).click();
    await expect(page.getByText('No items yet. Add the things you might lend out.')).toBeVisible();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Cordless drill');
    await page.getByText('Add item', { exact: true }).last().click();
    await expect(page.getByText('Cordless drill')).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();
  });

  await step(page, testInfo, 'Go to Home and lend the drill to Alex', async () => {
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Cordless drill', { exact: true }).last().click();
    await page.getByPlaceholder('Type a name').fill('Alex');
    await page.getByText('Lend it', { exact: true }).click();
  });

  await step(page, testInfo, 'Verify Home shows the active loan', async () => {
    await expect(page.getByText('1 item out')).toBeVisible();
    await expect(page.getByText('↗ Cordless drill')).toBeVisible();
    // The Items tab's own row shows the same "Lent to Alex" status and
    // stays mounted alongside Home (expo-router/ui keeps tab screens
    // alive), so this genuinely matches twice - .first() is enough here.
    await expect(page.getByText('Lent to Alex').first()).toBeVisible();
  });
});
