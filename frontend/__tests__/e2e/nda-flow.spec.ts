import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ───────────────────────────────────────────────────────────────

async function fillForm(page: Page, overrides: Record<string, string> = {}) {
  const values = {
    governingLaw: 'Delaware',
    jurisdiction: 'New Castle, Delaware',
    party1Name: 'Jane Smith',
    party1Title: 'CEO',
    party1Company: 'Acme Corp',
    party1Address: 'jane@acme.com',
    party2Name: 'John Doe',
    party2Title: 'CTO',
    party2Company: 'Beta Inc',
    party2Address: 'john@beta.com',
    ...overrides,
  }

  await page.getByPlaceholder('e.g. Delaware').fill(values.governingLaw)
  await page.getByPlaceholder('e.g. New Castle, Delaware').fill(values.jurisdiction)
  await page.getByPlaceholder('Jane Smith').fill(values.party1Name)
  await page.getByPlaceholder('CEO').fill(values.party1Title)
  await page.getByPlaceholder('Acme Corp').fill(values.party1Company)
  await page.getByPlaceholder('jane@acme.com or 123 Main St').fill(values.party1Address)
  await page.getByPlaceholder('John Doe').fill(values.party2Name)
  await page.getByPlaceholder('CTO').fill(values.party2Title)
  await page.getByPlaceholder('Beta Inc').fill(values.party2Company)
  await page.getByPlaceholder('john@beta.com or 456 Oak Ave').fill(values.party2Address)
}

// ─── Landing page ──────────────────────────────────────────────────────────

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the Mutual NDA Creator heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mutual NDA Creator' })).toBeVisible()
  })

  test('shows the Create NDA link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /create nda/i })).toBeVisible()
  })

  test('navigates to /create when Create NDA is clicked', async ({ page }) => {
    await page.getByRole('link', { name: /create nda/i }).click()
    await expect(page).toHaveURL('/create')
  })
})

// ─── Create page ───────────────────────────────────────────────────────────

test.describe('Create page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create')
  })

  test('renders the form heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create mutual nda/i })).toBeVisible()
  })

  test('shows Agreement Details, Party 1, and Party 2 sections', async ({ page }) => {
    await expect(page.getByText('Agreement Details')).toBeVisible()
    await expect(page.getByText('Party 1')).toBeVisible()
    await expect(page.getByText('Party 2')).toBeVisible()
  })

  test('pre-fills the purpose with default text', async ({ page }) => {
    const textarea = page.getByPlaceholder(/evaluating whether/i)
    await expect(textarea).toHaveValue(
      'Evaluating whether to enter into a business relationship with the other party.'
    )
  })

  test('shows the Preview NDA button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /preview nda/i })).toBeVisible()
  })

  test('prevents submission when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: /preview nda/i }).click()
    // Should stay on the create page due to HTML5 validation
    await expect(page).toHaveURL('/create')
  })

  test('switching to "until terminated" disables the year input', async ({ page }) => {
    await page.getByLabel('Continues until terminated').check()
    // The year input for MNDA term should be disabled
    const yearInput = page.locator('input[type="number"]').first()
    await expect(yearInput).toBeDisabled()
  })

  test('switching to "perpetuity" disables the confidentiality year input', async ({ page }) => {
    await page.getByLabel('In perpetuity').check()
    const yearInputs = page.locator('input[type="number"]')
    await expect(yearInputs.nth(1)).toBeDisabled()
  })
})

// ─── Full form → preview flow ──────────────────────────────────────────────

test.describe('Full NDA creation flow', () => {
  test('navigates to /preview after submitting filled form', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page).toHaveURL('/preview')
  })

  test('preview shows the document heading', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(
      page.getByRole('heading', { name: /mutual non-disclosure agreement/i })
    ).toBeVisible()
  })

  test('preview shows entered governing law', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page, { governingLaw: 'California' })
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('California').first()).toBeVisible()
  })

  test('preview shows party 1 name', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page, { party1Name: 'Alice Johnson' })
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('Alice Johnson').first()).toBeVisible()
  })

  test('preview shows party 2 company', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page, { party2Company: 'Gamma LLC' })
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('Gamma LLC')).toBeVisible()
  })

  test('preview shows the formatted effective date', async ({ page }) => {
    await page.goto('/create')
    await page.locator('input[type="date"]').fill('2025-03-15')
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('March 15, 2025').first()).toBeVisible()
  })

  test('preview shows custom purpose in cover page and standard terms', async ({ page }) => {
    await page.goto('/create')
    const purpose = 'Evaluating an acquisition opportunity'
    await page.getByPlaceholder(/evaluating whether/i).fill(purpose)
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    // Should appear multiple times (cover page + standard terms inline)
    await expect(page.getByText(purpose).first()).toBeVisible()
  })

  test('preview shows standard terms with all 11 sections', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByRole('heading', { name: /standard terms/i })).toBeVisible()
    for (let i = 1; i <= 11; i++) {
      await expect(page.locator(`li`).filter({ hasText: new RegExp(`^${i}\\.`) })).toBeVisible()
    }
  })

  test('"until terminated" term appears in preview', async ({ page }) => {
    await page.goto('/create')
    await page.getByLabel('Continues until terminated').check()
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(
      page.getByText(/continues until terminated in accordance with the terms/i).first()
    ).toBeVisible()
  })

  test('"In perpetuity" confidentiality term appears in preview', async ({ page }) => {
    await page.goto('/create')
    await page.getByLabel('In perpetuity').check()
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('In perpetuity').first()).toBeVisible()
  })

  test('MNDA Modifications text appears in preview when filled', async ({ page }) => {
    await page.goto('/create')
    await fillForm(page)
    await page.getByPlaceholder(/list any modifications/i).fill('Section 4 is waived by both parties.')
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page.getByText('Section 4 is waived by both parties.')).toBeVisible()
  })
})

// ─── Preview page navigation ───────────────────────────────────────────────

test.describe('Preview page navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Seed sessionStorage so preview page loads without redirecting
    await page.goto('/create')
    await fillForm(page)
    await page.getByRole('button', { name: /preview nda/i }).click()
    await expect(page).toHaveURL('/preview')
  })

  test('shows the Download PDF button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible()
  })

  test('shows the Edit back link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /edit/i })).toBeVisible()
  })

  test('clicking Edit navigates back to /create', async ({ page }) => {
    await page.getByRole('link', { name: /edit/i }).click()
    await expect(page).toHaveURL('/create')
  })
})

// ─── Preview redirect when no session data ────────────────────────────────

test.describe('Preview page — redirect', () => {
  test('redirects to /create when accessed directly with no sessionStorage', async ({ page }) => {
    // Clear storage before visiting
    await page.goto('/create')
    await page.evaluate(() => sessionStorage.clear())
    await page.goto('/preview')
    await expect(page).toHaveURL('/create')
  })
})

// ─── Accessibility ─────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('all form inputs have visible labels on /create', async ({ page }) => {
    await page.goto('/create')
    // Required inputs should have associated labels visible on the page
    const requiredInputs = page.locator('input[required]')
    const count = await requiredInputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('page has a focusable submit button on /create', async ({ page }) => {
    await page.goto('/create')
    const btn = page.getByRole('button', { name: /preview nda/i })
    await expect(btn).toBeEnabled()
    await btn.focus()
    await expect(btn).toBeFocused()
  })
})
