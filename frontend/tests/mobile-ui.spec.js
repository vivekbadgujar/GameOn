import { test, expect } from '@playwright/test';

test.describe('Mobile UI Fixes', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

  test('Mobile Navigation (Hamburger Menu) works correctly', async ({ page }) => {
    await page.goto('/');

    // Check if hamburger menu button is visible
    // Note: The button is only visible on mobile (md:hidden)
    const menuButton = page.locator('button:has(svg.lucide-menu)');
    await expect(menuButton).toBeVisible();

    // Click to open
    await menuButton.click();

    // Verify menu opens
    const mobileMenu = page.locator('.mobile-nav-content');
    await expect(mobileMenu).toBeVisible();
    
    // Verify positioning classes
    await expect(mobileMenu).toHaveClass(/absolute/);
    await expect(mobileMenu).toHaveClass(/top-full/);
    
    // Verify close button (X icon) switches
    const closeButton = page.locator('button:has(svg.lucide-x)');
    await expect(closeButton).toBeVisible();

    // Click close button
    await closeButton.click();

    // Verify menu closes
    await expect(mobileMenu).toBeHidden();
  });

  test('Video Popup is responsive on mobile', async ({ page }) => {
    // Mock the API response for videos
    await page.route('**/api/videos*', async route => {
      const json = {
        videos: [
          {
            _id: '1',
            title: 'Test Video',
            description: 'Test Description',
            youtubeId: 'dQw4w9WgXcQ',
            game: 'bgmi',
            createdAt: new Date().toISOString()
          }
        ]
      };
      await route.fulfill({ json });
    });

    // Mock public media
    await page.route('**/api/media/public*', async route => {
        const json = {
            media: []
        };
        await route.fulfill({ json });
    });

    await page.goto('/media');

    // Wait for videos to load
    const videoCard = page.locator('text=Test Video').first();
    await expect(videoCard).toBeVisible();

    // Click to open popup
    await videoCard.click();

    // Verify popup is visible
    const popup = page.locator('.fixed.inset-0.bg-black\\/90');
    await expect(popup).toBeVisible();

    // Verify responsive container
    // We look for the class max-w-[95vw] which we added
    const modalContainer = popup.locator('div').filter({ hasText: 'Test Video' }).first();
    await expect(modalContainer).toHaveClass(/max-w-\[95vw\]/);
    
    // Verify close button is visible
    const closeButton = popup.locator('button:has(svg.lucide-x)');
    await expect(closeButton).toBeVisible();

    // Close popup
    await closeButton.click();
    await expect(popup).toBeHidden();
  });
});
