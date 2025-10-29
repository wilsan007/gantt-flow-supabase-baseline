/**
 * Tests unitaires pour useOperationalActivities
 * Framework: Vitest + React Testing Library
 * Pattern: Arrange-Act-Assert (AAA)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOperationalActivities } from '../useOperationalActivities';
import { createSupabaseMock, mockOperationalActivity } from '@/test/mocks/supabase';

// Mock Supabase
const supabaseMock = createSupabaseMock();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

describe('useOperationalActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchActivities', () => {
    it('should fetch activities successfully', async () => {
      // Arrange
      const mockActivities = [
        {
          id: '1',
          name: 'Test Activity',
          kind: 'recurring',
          is_active: true,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockActivities,
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: true }));

      // Assert
      await waitFor(() => {
        expect(result.current.activities).toEqual(mockActivities);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      // Arrange
      const mockError = new Error('Fetch failed');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: true }));

      // Assert
      await waitFor(() => {
        expect(result.current.activities).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const mockFrom = vi.fn().mockImplementation(() => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
        return chain;
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() =>
        useOperationalActivities({
          autoFetch: true,
          filters: {
            kind: 'recurring',
            isActive: true,
            search: 'test',
          },
        })
      );

      // Assert
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('operational_activities');
      });
    });
  });

  describe('createActivity', () => {
    it('should create activity successfully', async () => {
      // Arrange
      const newActivity = {
        name: 'New Activity',
        kind: 'recurring' as const,
        scope: 'org' as const,
      };

      const mockCreated = { id: '1', ...newActivity };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreated,
              error: null,
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockCreated],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: false }));
      const created = await result.current.createActivity(newActivity);

      // Assert
      expect(created).toEqual(mockCreated);
    });

    it('should handle create error', async () => {
      // Arrange
      const mockError = new Error('Create failed');

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act & Assert
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: false }));
      
      await expect(
        result.current.createActivity({ name: 'Test', kind: 'recurring', scope: 'org' })
      ).rejects.toThrow();
    });
  });

  describe('updateActivity', () => {
    it('should update activity successfully', async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: false }));
      await result.current.updateActivity('1', { name: 'Updated' });

      // Assert
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('operational_activities');
      });
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity successfully', async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: false }));
      await result.current.deleteActivity('1');

      // Assert
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('operational_activities');
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle activity status', async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: false }));
      await result.current.toggleActive('1', false);

      // Assert
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('operational_activities');
      });
    });
  });

  describe('Cache behavior', () => {
    it('should use cache when available', async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Test' }],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result, rerender } = renderHook(() => useOperationalActivities({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstCallCount = mockFrom.mock.calls.length;

      // Rerender (should use cache)
      rerender();

      // Assert
      await waitFor(() => {
        expect(mockFrom.mock.calls.length).toBe(firstCallCount);
        expect(result.current.metrics.cacheHit).toBeTruthy();
      });
    });
  });

  describe('Metrics', () => {
    it('should track fetch time', async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      // Act
      const { result } = renderHook(() => useOperationalActivities({ autoFetch: true }));

      // Assert
      await waitFor(() => {
        expect(result.current.metrics.fetchTime).toBeGreaterThanOrEqual(0);
        expect(result.current.metrics.totalActivities).toBe(0);
      });
    });
  });
});
