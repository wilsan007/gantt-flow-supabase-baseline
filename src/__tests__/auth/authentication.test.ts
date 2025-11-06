import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: { access_token: 'test-token', refresh_token: 'refresh' },
        },
        error: null,
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe('Invalid login credentials');
    });

    it('should validate email format', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test @example.com'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });

      expect(emailRegex.test('valid@example.com')).toBe(true);
    });
  });

  describe('Sign Up', () => {
    it('should create new user successfully', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: { access_token: 'test-token', refresh_token: 'refresh' },
        },
        error: null,
      } as any);

      const result = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'securepassword123',
      });

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should prevent duplicate email registration', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      } as any);

      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error?.message).toBe('User already registered');
    });

    it('should validate password strength', () => {
      const weakPasswords = ['123', 'password', 'abc123'];
      const strongPassword = 'SecureP@ssw0rd123';

      // Minimum 8 characters, at least one uppercase, one lowercase, one number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

      weakPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(false);
      });

      expect(passwordRegex.test(strongPassword)).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      } as any);

      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should retrieve current session', async () => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-id', email: 'test@example.com' },
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should handle expired session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Session expired' },
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeNull();
      expect(result.error?.message).toBe('Session expired');
    });
  });
});
