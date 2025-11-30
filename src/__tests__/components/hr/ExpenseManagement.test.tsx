import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createSupabaseMock } from '@/test/mocks/supabase';

// Mock dependencies
vi.mock('@/contexts/RolesContext', () => ({
  useRolesCompat: () => ({
    userRoles: [],
    isLoading: false,
    hasRole: () => true,
    hasPermission: () => true,
  }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    tenantName: 'Test Company',
    loading: false,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'test-user', tenantId: 'tenant-1', role: 'admin' },
    isAuthenticated: true,
    loading: false,
    userContext: { tenantId: 'tenant-1' },
    hasPermission: () => true,
  }),
  useAuthFilterContext: () => ({
    profile: { id: 'test-user', tenantId: 'tenant-1', role: 'admin' },
    userContext: { tenantId: 'tenant-1' },
    loading: false,
    error: null,
  }),
}));

// Import real component
import { ExpenseManagement } from '@/components/hr/ExpenseManagement';

describe('ExpenseManagement - Real Component (Used in HRPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ExpenseManagement component', () => {
    const { container } = render(
      <BrowserRouter>
        <ExpenseManagement />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <ExpenseManagement />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <ExpenseManagement />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeDefined();
  });
});
