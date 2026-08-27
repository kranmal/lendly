import { test, expect, type Page } from '@playwright/test';
import { step } from './utils/step';

test.beforeEach(async ({ page }) => {
  // Block ads so the test never depends on real third-party hosts.
  await page.route('**pagead2.googlesyndication.com/**', (route) => route.abort());
});

/**
 * Waits for a sheet modal to actually finish closing rather than assuming a
 * submit click did it instantly - the "Person" field label only exists
 * inside the Lend/Borrow modal forms, so its absence is a reliable signal
 * the modal is gone, without colliding with a same-named trigger button
 * still sitting on the screen behind it (e.g. the Home "Lend an item"
 * button shares exact text with the modal's own title).
 */
async function waitForModalToClose(page: Page): Promise<void> {
  await expect(page.getByText('Person', { exact: true })).not.toBeVisible();
}

/**
 * expo-router/ui's tab navigator keeps every tab's screen mounted at once
 * and just hides the inactive ones, so a status line that appears on more
 * than one screen (e.g. a loan's "Lent to X" shows on both Home and Items)
 * genuinely exists twice in the DOM as soon as that loan exists - regardless
 * of which tab you're looking at. Same thing happens with a sheet modal:
 * its content can echo text also present on the screen behind it. Filtering
 * to the currently-visible match is what "the text this tab/modal is
 * showing" actually means here, rather than guessing at DOM order.
 */
function visibleText(page: Page, text: string) {
  return page.getByText(text, { exact: true }).filter({ visible: true });
}

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
// precedes the form content that contains it. Item/person names are always
// matched with `exact: true` too, since a bare name is a substring of its
// own loan-row line ("↗ Cordless drill" contains "Cordless drill").
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
    await expect(page.getByText('Cordless drill', { exact: true })).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();
  });

  await step(page, testInfo, 'Go to Home and lend the drill to Alex', async () => {
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Cordless drill', { exact: true }).last().click();
    await page.getByPlaceholder('Type a name').fill('Alex');
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Verify Home shows the active loan', async () => {
    await expect(page.getByText('1 item out')).toBeVisible();
    await expect(page.getByText('↗ Cordless drill')).toBeVisible();
    // The Items tab's own row shows the same "Lent to Alex" status and
    // stays mounted alongside Home (expo-router/ui keeps tab screens
    // alive), so this genuinely matches twice - visibleText() picks the
    // one actually on screen.
    await expect(visibleText(page, 'Lent to Alex')).toBeVisible();
  });
});

// Borrowing is the mirror image of lending, but a distinct code path
// (BorrowModal creates the item and the loan together in one step, rather
// than picking an existing item) - worth its own test.
test('borrowing something logs it as an active loan on Home and Items', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Log a borrow from Home', async () => {
    await page.goto('/');
    await page.getByText("I'm borrowing something", { exact: true }).click();
    await page.getByPlaceholder('Ladder').fill('Ladder');
    await page.getByPlaceholder('Type a name').fill('Jordan');
    await page.getByText('Log it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Verify Home shows the borrowed item', async () => {
    await expect(page.getByText('1 item out')).toBeVisible();
    await expect(page.getByText('↙ Ladder')).toBeVisible();
    await expect(visibleText(page, 'Borrowed from Jordan')).toBeVisible();
  });

  await step(page, testInfo, 'Verify Items shows the same item as borrowed', async () => {
    await page.getByRole('link', { name: 'Items' }).click();
    await expect(page.getByText('Ladder', { exact: true })).toBeVisible();
    await expect(visibleText(page, 'Borrowed from Jordan')).toBeVisible();
  });
});

// The "Returned" button on a Home loan row is the app's main return path -
// this checks it actually closes the loan out everywhere it's reflected,
// not just on Home: the item goes back to Available on Items (lent items,
// unlike borrowed ones, stay owned by us and keep showing up there).
test('marking a loan returned clears Home and returns the item to Available', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Add "Tent" and lend it to Sam', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Items' }).click();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Tent');
    await page.getByText('Add item', { exact: true }).last().click();

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Tent', { exact: true }).last().click();
    await page.getByPlaceholder('Type a name').fill('Sam');
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
    await expect(page.getByText('1 item out')).toBeVisible();
  });

  await step(page, testInfo, 'Mark it returned from the Home loan row', async () => {
    await visibleText(page, 'Returned').click();
  });

  await step(page, testInfo, 'Verify Home is empty again and the item is Available', async () => {
    await expect(page.getByText("Nothing's out right now.")).toBeVisible();
    await page.getByRole('link', { name: 'Items' }).click();
    await expect(page.getByText('Tent', { exact: true })).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();
  });
});

// People aren't a form you fill in - they're created automatically the
// first time you lend or borrow, and this is the one screen that
// aggregates a person's loans across time (both directions). Also checks
// that "Returned" works from inside the person's own detail view, not just
// the Home loan row.
test('People tab lists people from a loan, and supports marking returned from there', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Add "Projector" and lend it to Priya', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Items' }).click();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Projector');
    await page.getByText('Add item', { exact: true }).last().click();

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Projector', { exact: true }).last().click();
    await page.getByPlaceholder('Type a name').fill('Priya');
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Open People and verify Priya shows one active loan', async () => {
    await page.getByRole('link', { name: 'People' }).click();
    await expect(page.getByText('Priya', { exact: true })).toBeVisible();
    await expect(page.getByText('1 active')).toBeVisible();
  });

  await step(page, testInfo, "Open Priya's detail and mark the loan returned", async () => {
    await page.getByText('Priya', { exact: true }).click();
    await expect(visibleText(page, '↗ Projector')).toBeVisible();
    await visibleText(page, 'Returned').click();
  });

  await step(page, testInfo, 'Verify Priya now shows nothing active', async () => {
    await expect(page.getByText('Nothing active')).toBeVisible();
  });
});

// The person field suggests everyone you've already logged as chips
// (PersonNameField), and picking one is supposed to reuse that person
// (findOrCreatePerson matches by name) rather than silently creating a
// second "Morgan" - this is the one behavior that can only be checked by
// asserting the loan lands on the same person, not just that a chip exists.
test('the person picker suggests an existing person as a chip', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Borrow something from Morgan to create the person', async () => {
    await page.goto('/');
    await page.getByText("I'm borrowing something", { exact: true }).click();
    await page.getByPlaceholder('Ladder').fill('Drill bits');
    await page.getByPlaceholder('Type a name').fill('Morgan');
    await page.getByText('Log it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Add a second item and pick Morgan from the chip list while lending it', async () => {
    await page.getByRole('link', { name: 'Items' }).click();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Tape measure');
    await page.getByText('Add item', { exact: true }).last().click();

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Tape measure', { exact: true }).last().click();
    await page.getByText('Morgan', { exact: true }).click();
    await expect(page.getByPlaceholder('Type a name')).toHaveValue('Morgan');
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Verify the loan landed on the same Morgan, not a duplicate', async () => {
    await page.getByRole('link', { name: 'People' }).click();
    await expect(page.getByText('Morgan', { exact: true })).toHaveCount(1);
  });
});

// Opening an item straight from the Items list and choosing "Lend this" is
// a different code path than the Home "Lend an item" button: the item is
// already implied via a prop rather than picked from a list, so the picker
// UI should be skipped entirely - that's the one thing worth checking here
// that the Home-button flow (covered above) can't.
test('opening an item and choosing "Lend this" skips the item picker', async ({ page }, testInfo) => {
  await step(page, testInfo, 'Add "Umbrella" and open it from the Items list', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Items' }).click();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Umbrella');
    await page.getByText('Add item', { exact: true }).last().click();
    await page.getByText('Umbrella', { exact: true }).click();
  });

  await step(page, testInfo, 'Choose "Lend this" and verify the item picker is skipped', async () => {
    await page.getByText('Lend this', { exact: true }).click();
    await expect(page.getByText('Item', { exact: true })).not.toBeVisible();
    await page.getByPlaceholder('Type a name').fill('Casey');
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Verify Home shows the loan', async () => {
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByText('↗ Umbrella')).toBeVisible();
    await expect(visibleText(page, 'Lent to Casey')).toBeVisible();
  });
});

// Matches the same toggle already covered on the other apps in this
// portfolio: persists in AsyncStorage (localStorage on web) and survives a
// reload rather than resetting to system preference.
test('toggling the theme switches the icon and persists across reload', async ({ page }, testInfo) => {
  const toggle = () => page.getByRole('button', { name: 'Toggle light or dark theme' });

  await step(page, testInfo, 'Load the app in its default (light) theme', async () => {
    await page.goto('/');
    await expect(toggle()).toHaveText('◐');
  });

  await step(page, testInfo, 'Toggle to dark', async () => {
    await toggle().click();
    await expect(toggle()).toHaveText('☀');
  });

  await step(page, testInfo, 'Reload and verify dark mode persisted', async () => {
    await page.reload();
    await expect(toggle()).toHaveText('☀');
  });
});

// formatDueLabel()/isOverdue() compute their result from Date.now() at render
// time, but their only tracked input is loan.expectedReturn, which never
// changes - so React (and this app's React Compiler auto-memoization) has no
// signal that the output goes stale as real time passes. useNow() (see
// src/hooks/use-now.ts) exists to force a periodic re-render so that staleness
// gets caught. This drives a virtual clock forward past the due date with no
// user interaction at all in between, so a pass here can only mean the label
// re-rendered on its own timer, not because something else happened to
// re-render the row.
test("an active loan's due-date label updates on its own as time passes", async ({ page }, testInfo) => {
  await step(page, testInfo, 'Install a virtual clock and load the app', async () => {
    await page.clock.install();
    await page.goto('/');
  });

  await step(page, testInfo, 'Add "Tent" and lend it to Sam, due back in 3 days', async () => {
    await page.getByRole('link', { name: 'Items' }).click();
    await page.getByText('+ Add', { exact: true }).click();
    await page.getByPlaceholder('Cordless drill').fill('Tent');
    await page.getByText('Add item', { exact: true }).last().click();

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByText('Lend an item', { exact: true }).click();
    await page.getByText('Tent', { exact: true }).last().click();
    await page.getByPlaceholder('Type a name').fill('Sam');
    await page.getByText('3 days', { exact: true }).click();
    await page.getByText('Lend it', { exact: true }).click();
    await waitForModalToClose(page);
  });

  await step(page, testInfo, 'Verify Home shows "Due in 3 days"', async () => {
    await expect(page.getByText('Due in 3 days', { exact: true })).toBeVisible();
  });

  await step(page, testInfo, 'Advance the clock 4 days with no page interaction', async () => {
    // fastForward() jumps Date/Date.now() straight to the target time but,
    // per Playwright's docs, only fires timers that are already due "at most
    // once" - it doesn't pump the event loop the way real elapsed time would,
    // so the app's own 60s useNow() interval can end up jumped-past without
    // actually firing. A trailing runFor() over a window bigger than that
    // interval lets it fire normally once the jump lands it in the past.
    await page.clock.fastForward(4 * 24 * 60 * 60 * 1000);
    await page.clock.runFor(60_000);
  });

  await step(page, testInfo, 'Verify the label flipped to overdue on its own', async () => {
    await expect(page.getByText('Overdue by 1 day', { exact: true })).toBeVisible();
  });
});
