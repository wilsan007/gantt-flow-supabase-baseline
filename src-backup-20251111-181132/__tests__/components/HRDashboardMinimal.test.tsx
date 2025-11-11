import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/contexts/RolesContext', () => ({
  useRolesCompat: () => ({
    userRoles: [],
    isLoading: false,
    hasRole: () => true,
    hasPermission: () => true,
    isSuperAdmin: false,
    currentTenantId: 'tenant-1',
  }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    tenantName: 'Test Company',
    loading: false,
  }),
}));

vi.mock('@/hooks/useHRMinimal', () => ({
  useHRMinimal: () => ({
    employees: [],
    leaveRequests: [],
    attendances: [],
    absenceTypes: [],
    loading: false,
    error: null,
    metrics: {
      fetchTime: 100,
      cacheHit: false,
      dataSize: 0,
      lastUpdate: new Date(),
    },
    refresh: vi.fn(),
    clearCache: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-1' } },
          error: null,
        })
      ),
    },
  },
}));

// Import real component
import { HRDashboardMinimal } from '@/components/hr/HRDashboardMinimal';

describe('HRDashboardMinimal - Real Component (Used in HRPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render HRDashboardMinimal component', () => {
    const { container } = render(
      <BrowserRouter>
        <HRDashboardMinimal />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <HRDashboardMinimal />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <HRDashboardMinimal />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeDefined();
  });
});
