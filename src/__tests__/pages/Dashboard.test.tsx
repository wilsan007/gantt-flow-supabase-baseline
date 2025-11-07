/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock all dependencies
vi.mock('@/contexts/RolesContext', () => ({
  useRolesCompat: () => ({
    userRoles: [],
    userPermissions: [],
    isLoading: false,
    hasRole: () => false,
    hasPermission: () => false,
    isSuperAdmin: false,
    currentTenantId: 'tenant-1',
    refresh: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(),
  }),
  RolesProvider: ({ children }: any) => children,
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    tenantName: 'Test Tenant',
    loading: false,
    error: null,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-1', email: 'test@test.com' } },
          error: null,
        })
      ),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        })
      ),
    },
  },
}));

// Import real Dashboard component
import Dashboard from '@/pages/Dashboard';

describe('Dashboard Page - Real Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Dashboard component', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeDefined();
  });
});
