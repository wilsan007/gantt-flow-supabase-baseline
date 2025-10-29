/**
 * Mock de Supabase pour les tests
 * Pattern: Mock Factory
 */

import { vi } from 'vitest';

export const createSupabaseMock = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockReturnThis();
  const mockIlike = vi.fn().mockReturnThis();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    ilike: mockIlike,
  }));

  const mockRpc = vi.fn();

  return {
    from: mockFrom,
    rpc: mockRpc,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockOrder,
    mockSingle,
    mockIlike,
    mockRpc,
  };
};

export const mockOperationalActivity = {
  id: 'test-activity-1',
  tenant_id: 'test-tenant',
  name: 'Réunion hebdomadaire',
  description: 'Point équipe',
  kind: 'recurring' as const,
  scope: 'org' as const,
  department_id: null,
  owner_id: null,
  project_id: null,
  task_title_template: 'Réunion - Semaine {{isoWeek}}',
  is_active: true,
  created_at: '2025-01-13T00:00:00Z',
  updated_at: '2025-01-13T00:00:00Z',
  created_by: 'user-1',
};

export const mockOperationalSchedule = {
  id: 'test-schedule-1',
  tenant_id: 'test-tenant',
  activity_id: 'test-activity-1',
  timezone: 'UTC',
  rrule: 'FREQ=WEEKLY;BYDAY=MO',
  start_date: '2025-01-13',
  until: null,
  generate_window_days: 30,
  created_at: '2025-01-13T00:00:00Z',
  updated_at: '2025-01-13T00:00:00Z',
};

export const mockOperationalActionTemplate = {
  id: 'test-template-1',
  tenant_id: 'test-tenant',
  activity_id: 'test-activity-1',
  title: 'Préparer ordre du jour',
  description: 'Collecter les sujets',
  position: 0,
  created_at: '2025-01-13T00:00:00Z',
};
