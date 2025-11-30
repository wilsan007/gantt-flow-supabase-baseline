/**
 * Mock de Supabase pour les tests
 * Pattern: Mock Factory - Complet et Réutilisable
 */

import { vi } from 'vitest';

/**
 * Crée un mock complet du client Supabase
 * Usage: const supabase = createSupabaseMock();
 */
export const createSupabaseMock = () => {
  // === Database Query Mocks ===
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockUpsert = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockNeq = vi.fn().mockReturnThis();
  const mockNot = vi.fn().mockReturnThis();
  const mockGt = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLt = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockLike = vi.fn().mockReturnThis();
  const mockIlike = vi.fn().mockReturnThis();
  const mockIs = vi.fn().mockReturnThis();
  const mockIn = vi.fn().mockReturnThis();
  const mockContains = vi.fn().mockReturnThis();
  const mockContainedBy = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
    eq: mockEq,
    neq: mockNeq,
    not: mockNot,
    gt: mockGt,
    gte: mockGte,
    lt: mockLt,
    lte: mockLte,
    like: mockLike,
    ilike: mockIlike,
    is: mockIs,
    in: mockIn,
    contains: mockContains,
    containedBy: mockContainedBy,
    range: mockRange,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    then: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  }));

  // === Auth Mocks ===
  const mockOnAuthStateChange = vi.fn(callback => {
    // Simuler un événement initial
    setTimeout(() => {
      if (callback) callback('INITIAL_SESSION', null);
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    };
  });

  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: mockOnAuthStateChange,
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
  };

  // === Storage Mocks ===
  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test/path' },
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      getPublicUrl: vi.fn(path => ({
        data: { publicUrl: `https://example.com/${path}` },
      })),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/url' },
        error: null,
      }),
      list: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  };

  // === RPC Mock ===
  const mockRpc = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  });

  return {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
    rpc: mockRpc,

    // Expose les mocks pour manipulation dans les tests
    mocks: {
      // Database
      mockSelect,
      mockInsert,
      mockUpdate,
      mockDelete,
      mockUpsert,
      mockEq,
      mockNeq,
      mockNot,
      mockGt,
      mockGte,
      mockLt,
      mockLte,
      mockLike,
      mockIlike,
      mockIs,
      mockIn,
      mockContains,
      mockContainedBy,
      mockRange,
      mockOrder,
      mockLimit,
      mockSingle,
      mockMaybeSingle,

      // Auth
      mockOnAuthStateChange,

      // Other
      mockRpc,
    },
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
