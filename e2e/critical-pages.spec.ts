/**
 * Tests E2E - Pages Critiques Responsive
 * Valide le fonctionnement des 3 pages Error404 corrigées
 */

import { test, expect } from '@playwright/test';

test.describe('Pages Critiques - Design Moderne & Responsive', () => {
  test.describe('Analytics Page', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Ajouter authentification avant navigation
      // await page.goto('/auth');
      // await page.fill('[name="email"]', 'test@example.com');
      // await page.click('button[type="submit"]');

      await page.goto('/analytics');
    });

    test('doit afficher le header avec gradient', async ({ page }) => {
      const header = page.locator('h1');
      await expect(header).toBeVisible();

      // Vérifier texte responsive
      const headerText = await header.textContent();
      expect(headerText).toContain('Stat'); // "Stats" mobile ou "Mes Statistiques" desktop
    });

    test('doit afficher 4 stats cards avec glassmorphism', async ({ page }) => {
      // Attendre que les cards soient visibles
      await page.waitForSelector('div[class*="grid"]');

      // Compter les cards de stats
      const cards = page.locator('div[class*="bg-gradient"]');
      const count = await cards.count();

      expect(count).toBeGreaterThanOrEqual(4);
    });

    test("doit afficher les barres d'activité gradient animées", async ({ page }) => {
      // Vérifier présence section activité
      const activitySection = page.locator('text=Activité récente');
      await expect(activitySection).toBeVisible();

      // Vérifier les 7 jours
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      for (const day of days) {
        await expect(page.locator(`text=${day}`)).toBeVisible();
      }
    });

    test('doit afficher les achievements avec badges', async ({ page }) => {
      const achievementsSection = page.locator('text=Réalisations');
      await expect(achievementsSection).toBeVisible();

      // Vérifier présence badges
      const badges = page.locator('div[class*="badge"]');
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });

    test('doit être responsive sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      // Vérifier grid 2 colonnes mobile
      const statsGrid = page.locator('div[class*="grid-cols-2"]').first();
      await expect(statsGrid).toBeVisible();

      // Vérifier texte abrégé mobile
      const header = page.locator('h1');
      const headerText = await header.textContent();
      expect(headerText).toContain('Stats'); // Texte abrégé mobile
    });
  });

  test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
    });

    test('doit afficher 4 tabs responsive', async ({ page }) => {
      // Vérifier présence TabsList
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      // Compter les tabs
      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(4);

      // Vérifier labels tabs
      await expect(page.locator('text=Sécurité')).toBeVisible();
      await expect(page.locator('text=Profil')).toBeVisible();
      await expect(page.locator('text=Notifs')).toBeVisible();
      await expect(page.locator('text=Mot de passe, text=MDP')).toBeVisible(); // MDP sur mobile
    });

    test('doit permettre navigation entre tabs', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');

      // Cliquer sur chaque tab
      for (let i = 0; i < 4; i++) {
        await tabs.nth(i).click();

        // Vérifier que le tab est actif
        const dataState = await tabs.nth(i).getAttribute('data-state');
        expect(dataState).toBe('active');
      }
    });

    test('doit afficher grid 2x2 sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      const tabsList = page.locator('[role="tablist"]');
      const classes = await tabsList.getAttribute('class');

      // Vérifier présence grid-cols-2
      expect(classes).toContain('grid-cols-2');
    });

    test('doit afficher texte abrégé MDP sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      // Le tab password doit afficher "MDP" au lieu de "Mot de passe"
      const passwordTab = page.locator('[value="password"]');
      const text = await passwordTab.textContent();

      expect(text).toContain('MDP');
    });
  });

  test.describe('Inbox Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/inbox');
    });

    test('doit afficher header responsive', async ({ page }) => {
      const header = page.locator('h1');
      await expect(header).toBeVisible();

      // Vérifier texte responsive
      const headerText = await header.textContent();
      expect(headerText).toMatch(/Messages|Inbox/i);
    });

    test('doit afficher stats condensées', async ({ page }) => {
      // Vérifier présence stats grid
      const statsGrid = page.locator('div[class*="grid"]').first();
      await expect(statsGrid).toBeVisible();
    });

    test('doit avoir tabs scroll horizontal sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      const tabsList = page.locator('[role="tablist"]');
      const classes = await tabsList.getAttribute('class');

      // Vérifier overflow-x-auto
      expect(classes).toContain('overflow-x-auto');
    });

    test('doit afficher actions icon-only sur mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }

      // Vérifier présence boutons avec icons uniquement
      const iconButtons = page.locator('button svg');
      const count = await iconButtons.count();

      expect(count).toBeGreaterThan(0);
    });
  });
});
