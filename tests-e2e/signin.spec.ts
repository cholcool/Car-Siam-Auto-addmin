import { test, expect } from '@playwright/test'

const username = process.env.E2E_USERNAME ?? process.env.SEED_ADMIN_USERNAME ?? 'admin'
const password = process.env.E2E_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? 'admin'

test.describe('Sign-in flow', () => {
  test('user can sign in with username or email and see RBAC sidebar', async ({ page }) => {
    await page.goto('/signin')

    await page.fill('input[placeholder="Username or email"]', username)
    await page.fill('input[type="password"]', password)

    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    await page.waitForURL('**/dashboard', { timeout: 10000 })

    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible()
  })
})
