import { test, expect } from '@playwright/test';

test.describe('Comprehensive Registration & Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('Login page renders all required elements', async ({ page }) => {
    // Verify login form elements
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Register/i })).toBeVisible();

    // Verify branding
    await expect(page.getByRole('heading', { name: 'Login to CareVault' })).toBeVisible();
  });

  test('Caregiver registration form shows correct fields', async ({ page }) => {
    // Switch to registration mode
    await page.getByRole('button', { name: /Register/i }).click();
    await page.waitForTimeout(500);

    // Caregiver radio should be selected by default
    const caregiverRadio = page.locator('input[name="role"][value="caregiver"]');
    await expect(caregiverRadio).toBeVisible({ timeout: 5000 });
    await expect(caregiverRadio).toBeChecked();

    // Common fields visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();

    // Patient-specific fields should NOT be visible
    await expect(page.locator('input#caregiverEmail')).not.toBeVisible();
    await expect(page.locator('input#caregiverName')).not.toBeVisible();

    // Submit button should say "Sign Up"
    await expect(page.getByRole('button', { name: /Sign Up/i })).toBeVisible();
  });

  test('Patient registration form reveals caregiver fields', async ({ page }) => {
    // Switch to registration mode
    await page.getByRole('button', { name: /Register/i }).click();
    await page.waitForTimeout(500);

    // Select Patient role
    const patientRadio = page.locator('input[name="role"][value="patient"]');
    await expect(patientRadio).toBeVisible({ timeout: 5000 });
    await patientRadio.check();
    await page.waitForTimeout(500);

    // Patient-specific caregiver fields should now be visible
    await expect(page.locator('input#caregiverEmail')).toBeVisible();
    await expect(page.locator('input#caregiverName')).toBeVisible();

    // "Link to Your Caregiver" section should be visible
    await expect(page.getByText('Link to Your Caregiver')).toBeVisible();

    // Common fields should still be visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#fullName')).toBeVisible();
  });

  test('Toggle between Sign In and Register modes', async ({ page }) => {
    // Initially in Sign In mode - no registration fields
    await expect(page.locator('input#fullName')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // Switch to Register mode
    await page.getByRole('button', { name: /Register/i }).click();
    await page.waitForTimeout(500);

    // Registration fields should appear
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Up/i })).toBeVisible();

    // Switch back to Sign In mode
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(500);

    // Registration fields should disappear
    await expect(page.locator('input#fullName')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
});
