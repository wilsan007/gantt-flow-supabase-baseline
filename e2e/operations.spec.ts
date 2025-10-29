/**
 * Tests E2E pour le module Opérations
 * Framework: Playwright
 * Pattern: User Journey Testing
 */

import { test, expect } from '@playwright/test';

test.describe('Module Opérations - Activités Récurrentes', () => {
  test.beforeEach(async ({ page }) => {
    // Login et navigation vers /operations
    await page.goto('http://localhost:5173');
    
    // TODO: Ajouter la logique de login selon votre auth
    // await page.fill('[data-testid="email-input"]', 'test@example.com');
    // await page.fill('[data-testid="password-input"]', 'password');
    // await page.click('[data-testid="login-button"]');
    
    await page.goto('http://localhost:5173/operations');
    await page.waitForLoadState('networkidle');
  });

  test('should display operations page', async ({ page }) => {
    // Arrange & Act
    await page.waitForSelector('[data-testid="operations-page"]', { timeout: 5000 });

    // Assert
    await expect(page.locator('h1')).toContainText('Opérations');
    await expect(page.locator('[data-testid="new-recurring-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-oneoff-button"]')).toBeVisible();
  });

  test('should create a recurring activity', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="new-recurring-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Act - Onglet Informations
    await page.fill('[data-testid="activity-name-input"]', 'Réunion Hebdomadaire Test E2E');
    await page.fill('[data-testid="activity-description-input"]', 'Description de test');
    await page.fill('[data-testid="activity-template-input"]', 'Réunion - Semaine {{isoWeek}}');

    // Act - Onglet Planification
    await page.click('[data-testid="schedule-tab"]');
    await page.selectOption('[data-testid="frequency-select"]', 'weekly');
    await page.check('[data-testid="weekday-MO"]');
    await page.check('[data-testid="weekday-WE"]');

    // Act - Onglet Actions
    await page.click('[data-testid="actions-tab"]');
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-0"]', 'Préparer ordre du jour');
    await page.fill('[data-testid="action-description-0"]', 'Collecter les sujets');

    // Act - Submit
    await page.click('[data-testid="submit-activity-button"]');

    // Assert
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('text=Réunion Hebdomadaire Test E2E')).toBeVisible();
  });

  test('should filter activities by type', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="activity-card"]');
    const initialCount = await page.locator('[data-testid="activity-card"]').count();

    // Act
    await page.selectOption('[data-testid="kind-filter"]', 'recurring');
    await page.waitForTimeout(500); // Wait for filter

    // Assert
    const filteredCount = await page.locator('[data-testid="activity-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    // Verify all visible activities are recurring
    const kindBadges = await page.locator('[data-testid="activity-kind-badge"]').allTextContents();
    kindBadges.forEach(badge => {
      expect(badge).toContain('Récurrente');
    });
  });

  test('should search activities', async ({ page }) => {
    // Act
    await page.fill('[data-testid="search-input"]', 'réunion');
    await page.waitForTimeout(500);

    // Assert
    const activities = await page.locator('[data-testid="activity-card"]').allTextContents();
    activities.forEach(activity => {
      expect(activity.toLowerCase()).toContain('réunion');
    });
  });

  test('should view activity details', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="activity-card"]');

    // Act
    await page.click('[data-testid="activity-card"]');
    await page.waitForSelector('[role="dialog"]');

    // Assert - Tabs
    await expect(page.locator('[data-testid="info-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="occurrences-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-tab"]')).toBeVisible();

    // Assert - Content
    await page.click('[data-testid="stats-tab"]');
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-tasks"]')).toBeVisible();
  });

  test('should toggle activity status', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="activity-card"]');
    const firstActivity = page.locator('[data-testid="activity-card"]').first();

    // Act
    await firstActivity.locator('[data-testid="activity-menu-button"]').click();
    await page.click('[data-testid="toggle-active-menu-item"]');
    await page.waitForTimeout(500);

    // Assert
    await expect(firstActivity.locator('[data-testid="status-badge"]')).toContainText('Inactive');
  });

  test('should delete activity', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="activity-card"]');
    const initialCount = await page.locator('[data-testid="activity-card"]').count();

    // Act
    const firstActivity = page.locator('[data-testid="activity-card"]').first();
    await firstActivity.locator('[data-testid="activity-menu-button"]').click();
    await page.click('[data-testid="delete-menu-item"]');
    
    // Confirm deletion
    await page.waitForSelector('[role="alertdialog"]');
    await page.click('[data-testid="confirm-delete-button"]');
    await page.waitForTimeout(500);

    // Assert
    const newCount = await page.locator('[data-testid="activity-card"]').count();
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('Module Opérations - Activités Ponctuelles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/operations');
    await page.waitForLoadState('networkidle');
  });

  test('should create a one-off activity', async ({ page }) => {
    // Act
    await page.click('[data-testid="new-oneoff-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Fill form
    await page.fill('[data-testid="activity-name-input"]', 'Audit Ponctuel Test E2E');
    await page.fill('[data-testid="activity-description-input"]', 'Audit de sécurité annuel');
    
    // Select date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('[data-testid="due-date-input"]', tomorrow.toISOString().split('T')[0]);

    // Add action
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-0"]', 'Vérifier les logs');

    // Submit
    await page.click('[data-testid="submit-oneoff-button"]');

    // Assert
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Tâche générée');
  });

  test('should generate task immediately for one-off activity', async ({ page }) => {
    // Create one-off activity
    await page.click('[data-testid="new-oneoff-button"]');
    await page.fill('[data-testid="activity-name-input"]', 'Test Génération Immédiate');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('[data-testid="due-date-input"]', tomorrow.toISOString().split('T')[0]);
    await page.click('[data-testid="submit-oneoff-button"]');

    // Navigate to tasks page
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');

    // Assert task was created
    await expect(page.locator('text=Test Génération Immédiate')).toBeVisible();
    await expect(page.locator('[data-testid="operational-badge"]')).toBeVisible();
  });
});

test.describe('Module Opérations - Actions Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/operations');
    await page.waitForLoadState('networkidle');
  });

  test('should add multiple action templates', async ({ page }) => {
    // Open dialog
    await page.click('[data-testid="new-recurring-button"]');
    await page.click('[data-testid="actions-tab"]');

    // Add first action
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-0"]', 'Action 1');

    // Add second action
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-1"]', 'Action 2');

    // Add third action
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-2"]', 'Action 3');

    // Assert
    const actionInputs = await page.locator('[data-testid^="action-title-"]').count();
    expect(actionInputs).toBe(3);
  });

  test('should remove action template', async ({ page }) => {
    // Open dialog and add actions
    await page.click('[data-testid="new-recurring-button"]');
    await page.click('[data-testid="actions-tab"]');
    await page.click('[data-testid="add-action-button"]');
    await page.click('[data-testid="add-action-button"]');

    // Remove first action
    await page.click('[data-testid="remove-action-0"]');

    // Assert
    const actionInputs = await page.locator('[data-testid^="action-title-"]').count();
    expect(actionInputs).toBe(1);
  });

  test('should drag and drop to reorder actions', async ({ page }) => {
    // Open dialog and add actions
    await page.click('[data-testid="new-recurring-button"]');
    await page.click('[data-testid="actions-tab"]');
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-0"]', 'First');
    await page.click('[data-testid="add-action-button"]');
    await page.fill('[data-testid="action-title-1"]', 'Second');

    // Get initial order
    const firstActionBefore = await page.locator('[data-testid="action-title-0"]').inputValue();

    // Drag and drop (simulate reordering)
    const source = page.locator('[data-testid="action-drag-handle-0"]');
    const target = page.locator('[data-testid="action-drag-handle-1"]');
    
    await source.dragTo(target);
    await page.waitForTimeout(500);

    // Assert order changed
    const firstActionAfter = await page.locator('[data-testid="action-title-0"]').inputValue();
    expect(firstActionAfter).not.toBe(firstActionBefore);
  });
});

test.describe('Module Opérations - Performance', () => {
  test('should load operations page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/operations');
    await page.waitForSelector('[data-testid="operations-page"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle 50+ activities without lag', async ({ page }) => {
    await page.goto('http://localhost:5173/operations');
    await page.waitForLoadState('networkidle');

    // Scroll through list
    const startTime = Date.now();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const scrollTime = Date.now() - startTime;

    // Should scroll smoothly
    expect(scrollTime).toBeLessThan(1000);
  });
});

test.describe('Module Opérations - Error Handling', () => {
  test('should show validation error for empty name', async ({ page }) => {
    await page.goto('http://localhost:5173/operations');
    
    // Open dialog
    await page.click('[data-testid="new-recurring-button"]');
    
    // Try to submit without name
    await page.click('[data-testid="submit-activity-button"]');

    // Assert error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('requis');
  });

  test('should show error toast on network failure', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);
    
    await page.goto('http://localhost:5173/operations');
    await page.click('[data-testid="new-recurring-button"]');
    await page.fill('[data-testid="activity-name-input"]', 'Test');
    await page.click('[data-testid="submit-activity-button"]');

    // Assert error toast
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
  });
});
