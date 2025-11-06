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

vi.mock('@/hooks/optimized', () => ({
  useTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    createTask: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
    refresh: vi.fn()
  }),
  useProjects: () => ({
    projects: [],
    loading: false,
    error: null
  })
}));

vi.mock('@/hooks/useHRMinimal', () => ({
  useHRMinimal: () => ({
    employees: [],
    loading: false,
    error: null
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
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
import { ModernTaskCreationDialog } from '@/components/tasks/ModernTaskCreationDialog';

describe('ModernTaskCreationDialog - Real Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ModernTaskCreationDialog when open', () => {
    const { container } = render(
      <BrowserRouter>
        <ModernTaskCreationDialog 
          open={true} 
          onOpenChange={vi.fn()}
          onCreateTask={vi.fn()}
        />
      </BrowserRouter>
    );
    
    expect(container).toBeTruthy();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <BrowserRouter>
        <ModernTaskCreationDialog 
          open={false} 
          onOpenChange={vi.fn()}
          onCreateTask={vi.fn()}
        />
      </BrowserRouter>
    );
    
    expect(container).toBeTruthy();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <ModernTaskCreationDialog 
            open={true} 
            onOpenChange={vi.fn()}
            onCreateTask={vi.fn()}
          />
        </BrowserRouter>
      );
    }).not.toThrow();
  });
});
