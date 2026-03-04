import { expect, test } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Artisan Commerce/)
  await expect(page.locator('h1')).toContainText('Welcome to Artisan Commerce')
})

test('navigation works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('nav a[href="/"]')).toBeVisible()
  await expect(page.locator('nav a[href="/projects"]')).toBeVisible()
})
