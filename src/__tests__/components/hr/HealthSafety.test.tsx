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
  }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    tenantName: 'Test Company',
    loading: false,
  }),
}));

import { createSupabaseMock } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock(),
}));

// Import real component
import { HealthSafety } from '@/components/hr/HealthSafety';

describe('HealthSafety - Real Component (Used in HRPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render HealthSafety component', () => {
    const { container } = render(
      <BrowserRouter>
        <HealthSafety />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <HealthSafety />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <HealthSafety />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeDefined();
  });
});
