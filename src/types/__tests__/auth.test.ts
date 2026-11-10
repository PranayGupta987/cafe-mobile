import { extractAuthPayload, extractErrorMessage, User } from '../auth';

describe('Auth Helpers', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test Customer',
    email: 'customer@example.com',
    role: 'CUSTOMER',
  };

  describe('extractAuthPayload', () => {
    it('extracts payload from direct backend format { accessToken, refreshToken, user }', () => {
      const data = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-abc',
        user: mockUser,
      };

      const result = extractAuthPayload(data);
      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe('access-token-xyz');
      expect(result?.refreshToken).toBe('refresh-token-abc');
      expect(result?.user.id).toBe('user-123');
    });

    it('extracts payload from wrapped format { success: true, data: { user, tokens } }', () => {
      const data = {
        success: true,
        data: {
          user: mockUser,
          tokens: {
            accessToken: 'token-wrapped-123',
            refreshToken: 'refresh-wrapped-456',
          },
        },
      };

      const result = extractAuthPayload(data);
      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe('token-wrapped-123');
      expect(result?.refreshToken).toBe('refresh-wrapped-456');
    });

    it('returns null for null or invalid data', () => {
      expect(extractAuthPayload(null)).toBeNull();
      expect(extractAuthPayload({})).toBeNull();
      expect(extractAuthPayload({ error: 'Some error' })).toBeNull();
    });
  });

  describe('extractErrorMessage', () => {
    it('extracts string error from { error: "Email already in use" }', () => {
      const err = {
        response: {
          data: {
            error: 'Email already in use',
          },
        },
      };
      expect(extractErrorMessage(err)).toBe('Email already in use');
    });

    it('extracts Zod validation error from details array', () => {
      const err = {
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: [
                { field: 'password', message: 'Password must be at least 8 characters' },
              ],
            },
          },
        },
      };
      expect(extractErrorMessage(err)).toBe('Password must be at least 8 characters');
    });

    it('extracts message property from error object', () => {
      const err = {
        response: {
          data: {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
        },
      };
      expect(extractErrorMessage(err)).toBe('Resource not found');
    });

    it('falls back to err.message when response data is unavailable', () => {
      const err = new Error('Network Error');
      expect(extractErrorMessage(err)).toBe('Network Error');
    });
  });
});
