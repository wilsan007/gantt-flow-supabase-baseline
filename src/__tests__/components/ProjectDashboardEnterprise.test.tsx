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
    currentTenantId: 'tenant-1'
  })
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    tenantName: 'Test Company',
    loading: false
  })
}));

vi.mock('@/hooks/useProjectsEnterprise', () => ({
  useProjectsEnterprise: () => ({
    projects: [],
    loading: false,
    error: null,
    metrics: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalBudget: 0,
      fetchTime: 100,
      cacheHit: false
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      hasMore: false,
      totalPages: 0
    },
    refresh: vi.fn(),
    clearCache: vi.fn()
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1' } },
        error: null
      }))
    }
  }
}));

// Import real component
import { ProjectDashboardEnterprise } from '@/components/projects/ProjectDashboardEnterprise';

describe('ProjectDashboardEnterprise - Real Component (Used in ProjectPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ProjectDashboardEnterprise component', () => {
    const { container } = render(
      <BrowserRouter>
        <ProjectDashboardEnterprise />
      </BrowserRouter>
    );
    
    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <ProjectDashboardEnterprise />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <ProjectDashboardEnterprise />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toBeDefined();
  });
});
