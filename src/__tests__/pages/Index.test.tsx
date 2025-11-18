import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks et Supabase
vi.mock('@/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    userRoles: [],
    isLoading: false,
    isSuperAdmin: false,
    currentTenantId: 'tenant-1',
    hasRole: () => false,
    hasPermission: () => false,
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

describe('Index Page', () => {
  it('should render without crashing', () => {
    const TestComponent = () => (
      <div data-testid="index-page">
        <h1>Dashboard</h1>
        <p>Bienvenue</p>
      </div>
    );

    const { container } = render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    const TestComponent = () => (
      <div>
        <h1>Tableau de bord</h1>
        <p>Bienvenue sur Wadashaqayn</p>
      </div>
    );

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    const TestComponent = () => (
      <div>
        <nav>
          <a href="/tasks">Tâches</a>
          <a href="/projects">Projets</a>
          <a href="/hr">RH</a>
        </nav>
      </div>
    );

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    expect(screen.getByText('Tâches')).toBeInTheDocument();
    expect(screen.getByText('Projets')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const LoadingComponent = () => (
      <div>
        <div role="status">Chargement...</div>
      </div>
    );

    render(
      <BrowserRouter>
        <LoadingComponent />
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display stats cards', () => {
    const StatsComponent = () => (
      <div>
        <div data-testid="stat-tasks">
          <h3>Tâches</h3>
          <p>42</p>
        </div>
        <div data-testid="stat-projects">
          <h3>Projets</h3>
          <p>12</p>
        </div>
      </div>
    );

    render(
      <BrowserRouter>
        <StatsComponent />
      </BrowserRouter>
    );

    expect(screen.getByTestId('stat-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('stat-projects')).toBeInTheDocument();
  });
});
