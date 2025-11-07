import { expect, test } from '@playwright/test';

const base = process.env.WP_BASE_URL || 'http://localhost:8889';
const coordinatorUser = process.env.WP_COORDINATOR_USER || 'coordinator@example.com';
const coordinatorPass = process.env.WP_COORDINATOR_PASS || 'password';
const volunteerUser = process.env.WP_VOLUNTEER_USER || 'volunteer@example.com';
const volunteerPass = process.env.WP_VOLUNTEER_PASS || 'password';

async function login(page: any, username: string, password: string) {
  await page.goto(`${base}/wp-login.php`);
  await page.fill('#user_login', username);
  await page.fill('#user_pass', password);
  await page.click('#wp-submit');
}

async function openDashboard(page: any) {
  await page.goto(`${base}/wp-admin/admin.php?page=local4picnic`);
  await expect(page.locator('#l4p-admin-app')).toBeVisible();
}

async function logout(page: any) {
  await page.goto(`${base}/wp-login.php?action=logout`);
  if (await page.locator('text=log out').first().isVisible()) {
    await page.locator('text=log out').first().click();
  }
  await page.waitForURL(/wp-login\.php/);
}

test.describe('Local 4 Picnic role workflows', () => {
  test('coordinator can manage core modules', async ({ page }) => {
    await login(page, coordinatorUser, coordinatorPass);
    await openDashboard(page);

    // Tasks: create a task
    await page.click('text=Tasks');
    await page.click('text=New Task');
    await page.fill('label:has-text("Title") >> input', `Playwright Task ${Date.now()}`);
    await page.fill('label:has-text("Description") >> textarea', 'Automated task description');
    await page.click('.l4p-drawer-content button:has-text("Save")');
    await expect(page.locator('.l4p-toast:has-text("Task created.")')).toBeVisible();

    // Funding: add a transaction and ensure delete is available
    await page.click('text=Funding');
    await page.click('text=Add Transaction');
    await page.selectOption('label:has-text("Type") >> select', 'income');
    await page.fill('label:has-text("Amount") >> input', '123.45');
    await page.fill('label:has-text("Category") >> input', 'Playwright');
    await page.fill('label:has-text("Transaction Date") >> input', '2024-01-01');
    await page.click('.l4p-drawer-content button:has-text("Save")');
    await expect(page.locator('.l4p-toast:has-text("Funding saved.")')).toBeVisible();
    const editButton = page.locator('.l4p-table tbody tr >> text=Edit').first();
    await editButton.click({ timeout: 10000 });
    await expect(page.locator('.l4p-drawer-actions button:has-text("Delete")')).toBeVisible();
    await page.click('button[aria-label="Close"]');

    // Community: create a post
    await page.click('text=Community');
    const postBody = `Playwright community post ${Date.now()}`;
    await page.fill('textarea[aria-label="Community post"]', postBody);
    await page.click('.l4p-card button:has-text("Post")');
    await expect(page.locator('.l4p-toast:has-text("Post shared.")')).toBeVisible();
    await expect(page.locator('.l4p-card', { hasText: postBody })).toBeVisible();

    // Crew: ensure add member button available
    await page.click('text=Crew');
    await expect(page.locator('text=Add Member')).toBeVisible();

    // Notifications: mark all button visible
    await page.click('text=Notifications');
    await expect(page.locator('text=Mark All')).toBeVisible();

    await logout(page);
  });

  test('volunteer sees restricted controls', async ({ page }) => {
    await login(page, volunteerUser, volunteerPass);
    await openDashboard(page);

    // Funding: attempt edit should show permission toast
    await page.click('text=Funding');
    const actionButton = page.locator('.l4p-table tbody tr >> text=View').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      await expect(page.locator('.l4p-toast:has-text("You don\'t have permission")')).toBeVisible();
    } else {
      await expect(page.locator('text=No funding records.')).toBeVisible();
    }

    // Crew: no add member button
    await page.click('text=Crew');
    await expect(page.locator('text=Add Member')).toHaveCount(0);

    // Community: volunteer cannot delete coordinator post
    await page.click('text=Community');
    const firstPost = page.locator('.l4p-card').first();
    await expect(firstPost.locator('button:has-text("Delete")')).toHaveCount(0);

    // Settings tab hidden
    await expect(page.locator('text=Settings')).toHaveCount(0);

    await logout(page);
  });

  test('community posting toggle controls volunteers', async ({ page }) => {
    // Disable volunteer posting as coordinator
    await login(page, coordinatorUser, coordinatorPass);
    await openDashboard(page);
    await page.click('text=Settings');
    const toggle = page.locator('label:has-text("Volunteers can post in Community") input');
    const checked = await toggle.isChecked();
    if (checked) {
      await toggle.uncheck();
      await page.click('.l4p-button:has-text("Save Settings")');
      await expect(page.locator('.l4p-toast:has-text("Settings saved.")')).toBeVisible();
    }
    await logout(page);

    // Volunteer should not see composer
    await login(page, volunteerUser, volunteerPass);
    await openDashboard(page);
    await page.click('text=Community');
    await expect(page.locator('textarea[aria-label="Community post"]')).toHaveCount(0);
    await logout(page);

    // Re-enable setting for subsequent runs
    await login(page, coordinatorUser, coordinatorPass);
    await openDashboard(page);
    await page.click('text=Settings');
    const toggleBack = page.locator('label:has-text("Volunteers can post in Community") input');
    await toggleBack.check();
    await page.click('.l4p-button:has-text("Save Settings")');
    await expect(page.locator('.l4p-toast:has-text("Settings saved.")')).toBeVisible();
    await logout(page);
  });
});
