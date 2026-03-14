import { test, expect } from '@playwright/test';

test.describe('Registration Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('Caregiver registration submits to Supabase', async ({ page }) => {
    // Switch to Sign Up mode
    const registerToggle = page.getByRole('button', { name: /Register/i });
    await expect(registerToggle).toBeVisible();
    await registerToggle.click();
    await page.waitForTimeout(500);

    // Caregiver role should be selected by default
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible({ timeout: 5000 });
    await expect(caregiverRadio).toBeChecked();

    // Fill registration form with unique email
    const timestamp = Date.now();
    await page.locator('input#email').fill(`e2e-caregiver-${timestamp}@test.com`);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('E2E Caregiver');

    const phoneField = page.locator('input#phone');
    if (await phoneField.isVisible()) {
      await phoneField.fill('5551234567');
    }

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for Supabase response - button should show "Processing..."
    await expect(page.getByRole('button', { name: /Processing/i })).toBeVisible({ timeout: 5000 });

    // Wait for result: either redirect to dashboard or error message displayed
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    const hasError = await page.locator('.text-red-600').count() > 0;

    // Registration should result in either a redirect (auto-confirm) or stay on page
    if (currentUrl.includes('/dashboard') || currentUrl.endsWith('/')) {
      // Success: user was auto-confirmed and redirected
      expect(currentUrl).not.toContain('/login');
    } else {
      // Supabase responded - either error or email confirmation required
      // The form should no longer be in "Processing" state
      await expect(page.getByRole('button', { name: /Processing/i })).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('Patient registration submits with caregiver info', async ({ page }) => {
    // Switch to Sign Up mode
    const registerToggle = page.getByRole('button', { name: /Register/i });
    await registerToggle.click();
    await page.waitForTimeout(500);

    // Select Patient role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible({ timeout: 5000 });
    await patientRadio.check();
    await page.waitForTimeout(500);

    // Verify patient-specific fields appear
    const caregiverEmailField = page.locator('input#caregiverEmail');
    await expect(caregiverEmailField).toBeVisible();

    // Fill registration form
    const timestamp = Date.now();
    await page.locator('input#email').fill(`e2e-patient-${timestamp}@test.com`);
    await page.locator('input#password').fill('TestPass123!');
    await page.locator('input#fullName').fill('E2E Patient');
    await caregiverEmailField.fill('e2e-caregiver@test.com');

    const caregiverNameField = page.locator('input#caregiverName');
    if (await caregiverNameField.isVisible()) {
      await caregiverNameField.fill('E2E Caregiver');
    }

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for Supabase response
    await expect(page.getByRole('button', { name: /Processing/i })).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(5000);

    // Verify Supabase processed the request (no longer in loading state)
    await expect(page.getByRole('button', { name: /Processing/i })).not.toBeVisible({ timeout: 10000 });
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    // Fill login form with non-existent credentials
    await page.locator('input#email').fill('nonexistent@test.com');
    await page.locator('input#password').fill('WrongPassword123!');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for Supabase error response
    await expect(page.getByRole('button', { name: /Processing/i })).toBeVisible({ timeout: 5000 });

    // Should show error message from Supabase
    const errorMessage = page.locator('.text-red-600');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });
});
