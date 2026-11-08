import { test, expect } from '@playwright/test'

test.describe('Beranda Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display header with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display welcome message', async ({ page }) => {
    await expect(page.getByText(/selamat datang/i)).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })
})
