import { test, expect } from '@playwright/test';

test.describe('Payment Flow - End to End', () => {
  test('Complete merchant registration and payment processing', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    expect(await page.title()).toContain('Q Pay');

    // Step 2: Click on "Get Started"
    await page.click('text=Get Started');
    await page.waitForURL('**/register/**');

    // Step 3: Register as merchant
    await page.fill('input[name="email"]', `merchant-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="businessName"]', 'Test Business');
    await page.click('button:has-text("Register")');

    // Step 4: Verify registration success
    await page.waitForURL('**/dashboard');
    expect(await page.locator('text=Welcome').isVisible()).toBeTruthy();

    // Step 5: Navigate to payment terminal
    await page.click('a:has-text("Payment Terminal")');
    await page.waitForURL('**/payment-terminal');

    // Step 6: Process test payment
    await page.fill('input[type="number"]', '99.99');
    await page.click('button:has-text("Continue to Payment")');

    // Step 7: Select EMV payment method
    await page.click('text=Insert EMV Card');
    await page.waitForTimeout(500);

    // Step 8: Simulate card reading
    await page.click('text=Simulate Card Read');
    
    // Step 9: Verify transaction success
    await page.waitForSelector('text=Transaction Approved', { timeout: 10000 });
    expect(await page.locator('text=Transaction Approved').isVisible()).toBeTruthy();
    expect(await page.locator('text=$99.99').isVisible()).toBeTruthy();

    // Step 10: Verify transaction appears in dashboard
    await page.click('a:has-text("Back Office")');
    await page.waitForURL('**/back-office');
    await page.click('text=Transactions');
    
    // Check transaction appears
    await expect(page.locator('text=$99.99')).toBeVisible({ timeout: 5000 });
  });

  test('3D Secure authentication flow', async ({ page }) => {
    await page.goto('/payment-terminal');
    
    // Enter large amount to trigger 3D Secure
    await page.fill('input[type="number"]', '600.00');
    await page.click('button:has-text("Continue to Payment")');
    
    // Select online payment
    await page.click('text=Online Payment');
    
    // Verify 3D Secure challenge appears
    await expect(page.locator('text=3D Secure Verification')).toBeVisible({ timeout: 5000 });
    
    // Enter OTP
    await page.fill('input[placeholder="000000"]', '123456');
    await page.click('button:has-text("Verify Code")');
    
    // Verify success
    await expect(page.locator('text=Transaction Approved')).toBeVisible({ timeout: 5000 });
  });

  test('Contactless payment flow', async ({ page }) => {
    await page.goto('/payment-terminal');
    
    // Enter amount
    await page.fill('input[type="number"]', '45.50');
    await page.click('button:has-text("Continue to Payment")');
    
    // Select contactless
    await page.click('text=Contactless/NFC');
    
    // Verify reader UI appears
    await expect(page.locator('text=Hold card or phone near the reader')).toBeVisible({ timeout: 3000 });
    
    // Simulate card detection
    await page.click('text=Complete Payment');
    
    // Verify success
    await expect(page.locator('text=Transaction Approved')).toBeVisible({ timeout: 5000 });
  });

  test('Refund flow', async ({ page, context }) => {
    // First: Create a transaction to refund
    await page.goto('/payment-terminal');
    await page.fill('input[type="number"]', '50.00');
    await page.click('button:has-text("Continue to Payment")');
    await page.click('text=Insert EMV Card');
    await page.click('text=Simulate Card Read');
    
    const transactionId = await page.locator('text=Transaction ID').textContent();
    
    // Navigate to back office
    await page.click('a:has-text("Back Office")');
    await page.waitForURL('**/back-office');
    
    // Find and click refund button
    await page.click('text=Refund', { nth: 0 });
    
    // Enter refund amount
    await page.fill('input[placeholder="Amount"]', '50.00');
    await page.click('button:has-text("Process Refund")');
    
    // Verify refund success
    await expect(page.locator('text=Refund successful')).toBeVisible({ timeout: 5000 });
  });

  test('Settlement and payout flow', async ({ page }) => {
    await page.goto('/back-office');
    
    // Navigate to settlements
    await page.click('text=Settlements');
    
    // Calculate settlement
    await page.click('button:has-text("Calculate Settlement")');
    
    // Verify settlement summary
    await expect(page.locator('text=Gross Volume')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Net Payout')).toBeVisible();
    
    // Process payout
    await page.click('button:has-text("Process Payout")');
    
    // Verify payout initiated
    await expect(page.locator('text=Payout processing')).toBeVisible({ timeout: 5000 });
  });

  test('Alert configuration', async ({ page }) => {
    await page.goto('/back-office');
    
    // Click alerts tab
    await page.click('text=Alerts & Notifications');
    
    // Create alert
    await page.click('button:has-text("Create Alert")');
    
    // Select template
    await page.selectOption('select', 'High Transaction Alert');
    
    // Fill alert name
    await page.fill('input[placeholder="Alert Name"]', 'Test Alert');
    
    // Check notification channels
    await page.check('input[type="checkbox"]', { nth: 0 }); // Email
    
    // Create
    await page.click('button:has-text("Create Alert Configuration")');
    
    // Verify alert created
    await expect(page.locator('text=Test Alert')).toBeVisible({ timeout: 5000 });
  });

  test('Digital invoice generation', async ({ page }) => {
    // First create a transaction
    await page.goto('/payment-terminal');
    await page.fill('input[type="number"]', '75.00');
    await page.click('button:has-text("Continue to Payment")');
    await page.click('text=Insert EMV Card');
    await page.click('text=Simulate Card Read');
    
    // Navigate to invoices
    await page.click('a:has-text("Back Office")');
    await page.click('text=Digital Invoices');
    
    // Create invoice
    await page.click('button:has-text("Create Invoice")');
    
    // Verify invoice form
    await expect(page.locator('text=Invoice Number')).toBeVisible({ timeout: 3000 });
    
    // Send invoice
    await page.click('button:has-text("Send Invoice")');
    
    // Verify sent
    await expect(page.locator('text=Invoice sent')).toBeVisible({ timeout: 5000 });
  });

  test('API key management', async ({ page }) => {
    await page.goto('/back-office');
    
    // Navigate to API keys (from profile/settings)
    await page.click('text=API Keys');
    
    // Create new key
    await page.click('button:has-text("Create API Key")');
    
    // Fill in details
    await page.fill('input[placeholder="Key Name"]', 'Test API Key');
    await page.selectOption('select', 'production');
    
    // Create
    await page.click('button:has-text("Create")');
    
    // Verify key appears
    await expect(page.locator('text=Test API Key')).toBeVisible({ timeout: 5000 });
    
    // Verify key is shown once
    const keyModal = page.locator('text=qpay_');
    expect(await keyModal.isVisible()).toBeTruthy();
  });
});
