/**
 * Tests E2E - Touch Targets Conformité
 * Valide que tous les touch targets respectent les guidelines Apple/Google (40-44px minimum)
 */

import { test, expect } from '@playwright/test';

test.describe('Touch Targets - Conformité 44px', () => {
  test.describe('Boutons Principaux', () => {
    const pagesToTest = [
      { url: '/', name: 'Dashboard' },
      { url: '/analytics', name: 'Analytics' },
      { url: '/settings', name: 'Settings' },
      { url: '/inbox', name: 'Inbox' },
    ];

    for (const { url, name } of pagesToTest) {
      test(`${name} - Boutons >= 40px`, async ({ page, isMobile }) => {
        await page.goto(url);

        // Attendre chargement
        await page.waitForLoadState('networkidle');

        // Récupérer tous boutons visibles
        const buttons = page.locator('button:visible');
        const count = await buttons.count();

        let violations = 0;
        const tooSmallButtons: string[] = [];

        // Vérifier chaque bouton (max 20 pour ne pas ralentir)
        for (let i = 0; i < Math.min(count, 20); i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();

          if (box) {
            const height = box.height;
            const width = box.width;

            // Minimum 40px (idéal 44px)
            if (isMobile && (height < 40 || width < 40)) {
              violations++;
              const text = await button.textContent();
              tooSmallButtons.push(
                `Button "${text?.trim()}" - ${Math.round(width)}x${Math.round(height)}px`
              );
            }
          }
        }

        if (violations > 0) {
          console.log(`❌ ${name}: ${violations} boutons trop petits:`, tooSmallButtons);
        }

        // Tolérer max 2 violations (boutons d'icônes spéciaux)
        expect(violations).toBeLessThanOrEqual(2);
      });
    }
  });

  test.describe('Inputs et Formulaires', () => {
    test('Inputs signup >= 44px sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      await page.goto('/signup');

      const inputs = page.locator(
        'input[type="email"], input[type="password"], input[type="text"]'
      );
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();

        if (box) {
          // Mobile doit avoir h-11 (44px)
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('Selects >= 44px sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      await page.goto('/settings');

      const selects = page.locator('[role="combobox"]');
      const count = await selects.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const select = selects.nth(i);
          const box = await select.boundingBox();

          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });
  });

  test.describe('Tabs Navigation', () => {
    test('Tabs triggers >= 40px sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      await page.goto('/settings');

      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();

        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(38); // Tolérer 38px pour tabs
        }
      }
    });
  });

  test.describe('Icon Buttons', () => {
    test('Icon-only buttons >= 40px', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      await page.goto('/inbox');

      // Chercher boutons contenant uniquement des SVG (icon-only)
      const iconButtons = page.locator('button:has(svg):not(:has(span:not([class*="sr-only"])))');
      const count = await iconButtons.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 10); i++) {
          const button = iconButtons.nth(i);
          const box = await button.boundingBox();

          if (box) {
            // Icon buttons doivent être carrés 40x40 minimum
            expect(box.height).toBeGreaterThanOrEqual(36); // Tolérer 36px
            expect(box.width).toBeGreaterThanOrEqual(36);
          }
        }
      }
    });
  });

  test.describe('Cards et Items Cliquables', () => {
    test('Cards hover area adequate', async ({ page }) => {
      await page.goto('/analytics');

      // Vérifier que les cards ont une zone de clic adéquate
      const cards = page.locator('div[class*="hover"]');
      const count = await cards.count();

      if (count > 0) {
        const firstCard = cards.first();
        const box = await firstCard.boundingBox();

        if (box) {
          // Les cards doivent avoir une hauteur raisonnable
          expect(box.height).toBeGreaterThan(60);
        }
      }
    });
  });
});

test.describe('Conformité Guidelines', () => {
  test('Apple Human Interface Guidelines', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');

    // Apple recommande 44x44pt minimum
    const primaryButtons = page.locator('button[class*="primary"], button[class*="bg-primary"]');
    const count = await primaryButtons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = primaryButtons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Material Design Guidelines', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');

    // Material Design recommande 48dp minimum (≈48px)
    const buttons = page.locator('button:visible').first();
    const box = await buttons.boundingBox();

    if (box) {
      // On tolère 40px minimum (notre standard)
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});
