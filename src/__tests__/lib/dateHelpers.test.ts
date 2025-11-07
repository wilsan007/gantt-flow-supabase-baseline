import { describe, it, expect } from 'vitest';

// Tests pour les helpers de dates
describe('Date Helpers', () => {
  describe('Date Formatting', () => {
    it('should format date to locale string', () => {
      const formatDate = (date: Date, locale = 'fr-FR') => {
        return date.toLocaleDateString(locale);
      };

      const testDate = new Date('2025-01-15');
      const formatted = formatDate(testDate);

      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should format date to ISO string', () => {
      const formatToISO = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      expect(formatToISO(new Date('2025-01-15T10:30:00'))).toBe('2025-01-15');
    });

    it('should format time', () => {
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const testDate = new Date('2025-01-15T14:30:00');
      const formatted = formatTime(testDate);

      expect(formatted).toBeDefined();
    });

    it('should format datetime', () => {
      const formatDateTime = (date: Date) => {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      };

      const result = formatDateTime(new Date());
      expect(result).toContain(':');
    });
  });

  describe('Date Calculations', () => {
    it('should add days to date', () => {
      const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      };

      const today = new Date('2025-01-01');
      const future = addDays(today, 7);

      expect(future.getDate()).toBe(8);
    });

    it('should subtract days from date', () => {
      const subtractDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() - days);
        return result;
      };

      const today = new Date('2025-01-10');
      const past = subtractDays(today, 5);

      expect(past.getDate()).toBe(5);
    });

    it('should calculate days between dates', () => {
      const daysBetween = (date1: Date, date2: Date) => {
        const diff = Math.abs(date2.getTime() - date1.getTime());
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      };

      const start = new Date('2025-01-01');
      const end = new Date('2025-01-08');

      expect(daysBetween(start, end)).toBe(7);
    });

    it('should calculate weeks between dates', () => {
      const weeksBetween = (date1: Date, date2: Date) => {
        const days = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
        return Math.floor(days / 7);
      };

      const start = new Date('2025-01-01');
      const end = new Date('2025-01-29');

      expect(weeksBetween(start, end)).toBe(4);
    });

    it('should calculate months between dates', () => {
      const monthsBetween = (date1: Date, date2: Date) => {
        const years = date2.getFullYear() - date1.getFullYear();
        const months = date2.getMonth() - date1.getMonth();
        return years * 12 + months;
      };

      const start = new Date('2025-01-01');
      const end = new Date('2025-06-01');

      expect(monthsBetween(start, end)).toBe(5);
    });
  });

  describe('Date Comparisons', () => {
    it('should check if date is today', () => {
      const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
      };

      expect(isToday(new Date())).toBe(true);
      expect(isToday(new Date('2024-01-01'))).toBe(false);
    });

    it('should check if date is in past', () => {
      const isInPast = (date: Date) => {
        return date < new Date();
      };

      const yesterday = new Date(Date.now() - 86400000);
      const tomorrow = new Date(Date.now() + 86400000);

      expect(isInPast(yesterday)).toBe(true);
      expect(isInPast(tomorrow)).toBe(false);
    });

    it('should check if date is in future', () => {
      const isInFuture = (date: Date) => {
        return date > new Date();
      };

      const yesterday = new Date(Date.now() - 86400000);
      const tomorrow = new Date(Date.now() + 86400000);

      expect(isInFuture(yesterday)).toBe(false);
      expect(isInFuture(tomorrow)).toBe(true);
    });

    it('should check if date is weekend', () => {
      const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      };

      const saturday = new Date('2025-01-04'); // Saturday
      const monday = new Date('2025-01-06'); // Monday

      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });

    it('should check if date is weekday', () => {
      const isWeekday = (date: Date) => {
        const day = date.getDay();
        return day >= 1 && day <= 5;
      };

      const monday = new Date('2025-01-06');
      const saturday = new Date('2025-01-04');

      expect(isWeekday(monday)).toBe(true);
      expect(isWeekday(saturday)).toBe(false);
    });
  });

  describe('Date Ranges', () => {
    it('should check if date is in range', () => {
      const isInRange = (date: Date, start: Date, end: Date) => {
        return date >= start && date <= end;
      };

      const target = new Date('2025-01-15');
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');
      const outside = new Date('2025-02-01');

      expect(isInRange(target, start, end)).toBe(true);
      expect(isInRange(outside, start, end)).toBe(false);
    });

    it('should get start of day', () => {
      const startOfDay = (date: Date) => {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
      };

      const date = new Date('2025-01-15T14:30:00');
      const start = startOfDay(date);

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it('should get end of day', () => {
      const endOfDay = (date: Date) => {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
      };

      const date = new Date('2025-01-15T14:30:00');
      const end = endOfDay(date);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('should get start of month', () => {
      const startOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      };

      const date = new Date('2025-01-15');
      const start = startOfMonth(date);

      expect(start.getDate()).toBe(1);
    });

    it('should get end of month', () => {
      const endOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      };

      const date = new Date('2025-01-15');
      const end = endOfMonth(date);

      expect(end.getDate()).toBe(31);
    });
  });

  describe('Relative Time', () => {
    it('should get relative time string', () => {
      const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
        if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return "à l'instant";
      };

      const oneHourAgo = new Date(Date.now() - 3600000);
      const result = getRelativeTime(oneHourAgo);

      expect(result).toContain('heure');
    });

    it('should format age from birthdate', () => {
      const calculateAge = (birthdate: Date) => {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDiff = today.getMonth() - birthdate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
          age--;
        }

        return age;
      };

      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

      expect(calculateAge(twentyYearsAgo)).toBeGreaterThanOrEqual(19);
    });
  });

  describe('Business Days', () => {
    it('should count business days between dates', () => {
      const countBusinessDays = (startDate: Date, endDate: Date) => {
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) {
            // Not Sunday or Saturday
            count++;
          }
          current.setDate(current.getDate() + 1);
        }

        return count;
      };

      const start = new Date('2025-01-06'); // Monday
      const end = new Date('2025-01-10'); // Friday

      expect(countBusinessDays(start, end)).toBe(5);
    });

    it('should add business days', () => {
      const addBusinessDays = (date: Date, days: number) => {
        const result = new Date(date);
        let addedDays = 0;

        while (addedDays < days) {
          result.setDate(result.getDate() + 1);
          const day = result.getDay();
          if (day !== 0 && day !== 6) {
            addedDays++;
          }
        }

        return result;
      };

      const monday = new Date('2025-01-06');
      const result = addBusinessDays(monday, 5);

      expect(result.getDay()).not.toBe(0); // Not Sunday
      expect(result.getDay()).not.toBe(6); // Not Saturday
    });
  });
});
