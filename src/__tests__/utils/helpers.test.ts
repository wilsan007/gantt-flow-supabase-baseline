import { describe, it, expect } from 'vitest';

describe('Helper Utilities', () => {
  describe('String Formatting', () => {
    it('should format names correctly', () => {
      const formatFullName = (firstName: string, lastName: string) => {
        return `${firstName} ${lastName}`.trim();
      };
      
      expect(formatFullName('John', 'Doe')).toBe('John Doe');
      expect(formatFullName('Jane', '')).toBe('Jane');
      expect(formatFullName('', 'Smith')).toBe('Smith');
    });

    it('should generate initials', () => {
      const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
      };
      
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Smith Wilson')).toBe('JSW');
      expect(getInitials('Alice')).toBe('A');
    });

    it('should truncate long strings', () => {
      const truncate = (str: string, maxLength: number) => {
        return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
      };
      
      expect(truncate('Short text', 20)).toBe('Short text');
      expect(truncate('This is a very long text', 10)).toBe('This is a ...');
    });
  });

  describe('Date Utilities', () => {
    it('should check if date is in past', () => {
      const isInPast = (date: Date) => {
        return date.getTime() < Date.now();
      };
      
      const yesterday = new Date(Date.now() - 86400000);
      const tomorrow = new Date(Date.now() + 86400000);
      
      expect(isInPast(yesterday)).toBe(true);
      expect(isInPast(tomorrow)).toBe(false);
    });

    it('should calculate days between dates', () => {
      const daysBetween = (date1: Date, date2: Date) => {
        const diff = Math.abs(date2.getTime() - date1.getTime());
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      };
      
      const today = new Date('2025-01-01');
      const nextWeek = new Date('2025-01-08');
      
      expect(daysBetween(today, nextWeek)).toBe(7);
    });

    it('should format date to ISO string', () => {
      const formatToISO = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      const testDate = new Date('2025-01-15T10:00:00Z');
      expect(formatToISO(testDate)).toBe('2025-01-15');
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates', () => {
      const removeDuplicates = <T>(arr: T[]) => {
        return [...new Set(arr)];
      };
      
      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(removeDuplicates(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });

    it('should group by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T) => {
        return arr.reduce((acc, item) => {
          const keyValue = String(item[key]);
          if (!acc[keyValue]) acc[keyValue] = [];
          acc[keyValue].push(item);
          return acc;
        }, {} as Record<string, T[]>);
      };
      
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' }
      ];
      
      const grouped = groupBy(items, 'category');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });

    it('should chunk array', () => {
      const chunk = <T>(arr: T[], size: number) => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };
      
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone object', () => {
      const deepClone = <T>(obj: T): T => {
        return JSON.parse(JSON.stringify(obj));
      };
      
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      cloned.b.c = 3;
      
      expect(original.b.c).toBe(2);
      expect(cloned.b.c).toBe(3);
    });

    it('should pick properties', () => {
      const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        return keys.reduce((acc, key) => {
          if (key in obj) acc[key] = obj[key];
          return acc;
        }, {} as Pick<T, K>);
      };
      
      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('should omit properties', () => {
      const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
      };
      
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);
      
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should validate strong password', () => {
      const isStrongPassword = (password: string) => {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[0-9]/.test(password);
      };
      
      expect(isStrongPassword('Abc123456')).toBe(true);
      expect(isStrongPassword('weak')).toBe(false);
      expect(isStrongPassword('NoNumber')).toBe(false);
    });

    it('should validate URL', () => {
      const isValidURL = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('not-a-url')).toBe(false);
    });
  });

  describe('Number Utilities', () => {
    it('should format currency', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency
        }).format(amount);
      };
      
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should calculate percentage', () => {
      const percentage = (value: number, total: number) => {
        return total === 0 ? 0 : Math.round((value / total) * 100);
      };
      
      expect(percentage(25, 100)).toBe(25);
      expect(percentage(33, 100)).toBe(33);
      expect(percentage(10, 0)).toBe(0);
    });

    it('should clamp number', () => {
      const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
      };
      
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
