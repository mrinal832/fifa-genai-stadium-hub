const { test, expect } = require('@playwright/test');

test.describe('FIFA WC 2026 GenAI Hub - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // We test against the local build
    await page.goto('http://127.0.0.1:3000/');
  });

  test('has correct title and SEO meta tags', async ({ page }) => {
    await expect(page).toHaveTitle(/FIFA World Cup 2026/);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /AI-powered stadium operations/);
  });

  test('hero section is visible and contains stats', async ({ page }) => {
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
    await expect(page.locator('#stat-fans')).toBeVisible();
    await expect(page.locator('#stat-venues')).toBeVisible();
  });

  test('navigation module renders map and chat', async ({ page }) => {
    await page.click('text=🗺️ Navigate');
    await expect(page.locator('#navigation-module')).toBeVisible();
    await expect(page.locator('#stadium-map')).toBeVisible();
    await expect(page.locator('#nav-chat-form')).toBeVisible();
  });

  test('crowd module renders zones and alerts', async ({ page }) => {
    await page.click('text=👥 Crowd');
    await expect(page.locator('#crowd-module')).toBeVisible();
    await expect(page.locator('#zone-density-grid')).toBeVisible();
    
    // Simulate crowd change
    await page.click('text=🔄 Simulate');
    // Ensure toast appears
    await expect(page.locator('.toast')).toBeVisible();
  });

  test('accessibility module toggles high contrast', async ({ page }) => {
    await page.click('text=♿ Access');
    await expect(page.locator('#access-module')).toBeVisible();
    
    // Toggle high contrast
    await page.check('#toggle-highcontrast');
    const body = page.locator('body');
    await expect(body).toHaveClass(/high-contrast/);
    
    // Toggle off
    await page.uncheck('#toggle-highcontrast');
    await expect(body).not.toHaveClass(/high-contrast/);
  });

  test('sustainability module calculates carbon footprint', async ({ page }) => {
    await page.click('text=🌿 Eco');
    await expect(page.locator('#sustain-module')).toBeVisible();
    
    // Change transport to driving
    await page.selectOption('#carbon-transport', 'drive');
    // Change distance
    await page.fill('#carbon-distance', '100');
    
    // Check if result updated (100 * 0.192 = 19.2)
    const carbonVal = await page.locator('#carbon-kg').textContent();
    expect(carbonVal).toBe('19.20');
  });

  test('theme toggle switches dark/light mode', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    
    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'light');
    
    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('operations module filters tasks', async ({ page }) => {
    await page.click('text=🏟️ Ops');
    await expect(page.locator('#ops-module')).toBeVisible();
    
    // Click Urgent filter
    await page.click('button:has-text("🔴 Urgent")');
    // Verify only urgent tasks are shown (by checking class)
    const tasks = page.locator('.task-item');
    const count = await tasks.count();
    for (let i = 0; i < count; i++) {
      await expect(tasks.nth(i).locator('.task-priority')).toHaveClass(/priority-urgent/);
    }
  });

  test('decisions module renders KPI chart', async ({ page }) => {
    await page.click('text=📊 Intel');
    await expect(page.locator('#decision-module')).toBeVisible();
    await expect(page.locator('#kpi-chart')).toBeVisible();
  });
});
