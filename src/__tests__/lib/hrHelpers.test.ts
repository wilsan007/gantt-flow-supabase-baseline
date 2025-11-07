import { describe, it, expect } from 'vitest';

// Tests pour les helpers RH
describe('HR Helpers', () => {
  describe('Leave Request Management', () => {
    it('should calculate leave duration in days', () => {
      const calculateLeaveDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le dernier jour
      };

      expect(calculateLeaveDays('2025-01-01', '2025-01-05')).toBe(5);
      expect(calculateLeaveDays('2025-01-01', '2025-01-01')).toBe(1);
    });

    it('should validate leave dates', () => {
      const validateLeaveDates = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start < now) return { valid: false, error: 'Cannot request leave in the past' };
        if (start > end) return { valid: false, error: 'End date must be after start date' };

        return { valid: true, error: null };
      };

      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();

      expect(validateLeaveDates(tomorrow, nextWeek).valid).toBe(true);
      expect(validateLeaveDates(yesterday, nextWeek).valid).toBe(false);
    });

    it('should get leave status color', () => {
      const getLeaveStatusColor = (status: string) => {
        const colors: Record<string, string> = {
          pending: 'yellow',
          approved: 'green',
          rejected: 'red',
          cancelled: 'gray',
        };
        return colors[status] || 'default';
      };

      expect(getLeaveStatusColor('approved')).toBe('green');
      expect(getLeaveStatusColor('rejected')).toBe('red');
      expect(getLeaveStatusColor('pending')).toBe('yellow');
    });

    it('should check if leave overlaps with existing leaves', () => {
      const checkLeaveOverlap = (
        newLeave: { start_date: string; end_date: string },
        existingLeaves: Array<{ start_date: string; end_date: string }>
      ) => {
        const newStart = new Date(newLeave.start_date);
        const newEnd = new Date(newLeave.end_date);

        return existingLeaves.some(leave => {
          const existingStart = new Date(leave.start_date);
          const existingEnd = new Date(leave.end_date);

          return (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          );
        });
      };

      const existing = [{ start_date: '2025-01-10', end_date: '2025-01-15' }];

      expect(
        checkLeaveOverlap({ start_date: '2025-01-12', end_date: '2025-01-14' }, existing)
      ).toBe(true);

      expect(
        checkLeaveOverlap({ start_date: '2025-01-20', end_date: '2025-01-25' }, existing)
      ).toBe(false);
    });
  });

  describe('Attendance Management', () => {
    it('should calculate attendance rate', () => {
      const calculateAttendanceRate = (present: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((present / total) * 100);
      };

      expect(calculateAttendanceRate(18, 20)).toBe(90);
      expect(calculateAttendanceRate(20, 20)).toBe(100);
      expect(calculateAttendanceRate(0, 20)).toBe(0);
    });

    it('should check if late arrival', () => {
      const isLateArrival = (arrivalTime: string, scheduledTime: string) => {
        const arrival = new Date(`2025-01-01 ${arrivalTime}`);
        const scheduled = new Date(`2025-01-01 ${scheduledTime}`);
        return arrival > scheduled;
      };

      expect(isLateArrival('09:15', '09:00')).toBe(true);
      expect(isLateArrival('08:55', '09:00')).toBe(false);
    });

    it('should calculate late minutes', () => {
      const calculateLateMinutes = (arrivalTime: string, scheduledTime: string) => {
        const arrival = new Date(`2025-01-01 ${arrivalTime}`);
        const scheduled = new Date(`2025-01-01 ${scheduledTime}`);
        const diff = arrival.getTime() - scheduled.getTime();
        return Math.max(0, Math.floor(diff / (1000 * 60)));
      };

      expect(calculateLateMinutes('09:15', '09:00')).toBe(15);
      expect(calculateLateMinutes('09:30', '09:00')).toBe(30);
      expect(calculateLateMinutes('08:55', '09:00')).toBe(0);
    });

    it('should determine attendance status', () => {
      const getAttendanceStatus = (record: {
        check_in?: string;
        check_out?: string;
        is_absent?: boolean;
        is_on_leave?: boolean;
      }) => {
        if (record.is_on_leave) return 'on_leave';
        if (record.is_absent) return 'absent';
        if (record.check_in && record.check_out) return 'present';
        if (record.check_in) return 'checked_in';
        return 'not_checked_in';
      };

      expect(getAttendanceStatus({ is_on_leave: true })).toBe('on_leave');
      expect(getAttendanceStatus({ is_absent: true })).toBe('absent');
      expect(getAttendanceStatus({ check_in: '09:00', check_out: '18:00' })).toBe('present');
    });
  });

  describe('Employee Management', () => {
    it('should calculate employee tenure in years', () => {
      const calculateTenure = (hireDate: string) => {
        const hire = new Date(hireDate);
        const now = new Date();
        const years = now.getFullYear() - hire.getFullYear();
        return years;
      };

      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      expect(calculateTenure(threeYearsAgo.toISOString())).toBeGreaterThanOrEqual(2);
    });

    it('should format employee ID', () => {
      const formatEmployeeId = (id: number) => {
        return `EMP${String(id).padStart(4, '0')}`;
      };

      expect(formatEmployeeId(1)).toBe('EMP0001');
      expect(formatEmployeeId(123)).toBe('EMP0123');
      expect(formatEmployeeId(9999)).toBe('EMP9999');
    });

    it('should validate employee email', () => {
      const isValidEmployeeEmail = (email: string, domain: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) return false;
        return email.endsWith(`@${domain}`);
      };

      expect(isValidEmployeeEmail('user@company.com', 'company.com')).toBe(true);
      expect(isValidEmployeeEmail('user@other.com', 'company.com')).toBe(false);
      expect(isValidEmployeeEmail('invalid-email', 'company.com')).toBe(false);
    });

    it('should check if employee is active', () => {
      const isEmployeeActive = (employee: { status: string; termination_date?: string }) => {
        if (employee.status !== 'active') return false;
        if (employee.termination_date && new Date(employee.termination_date) <= new Date()) {
          return false;
        }
        return true;
      };

      expect(isEmployeeActive({ status: 'active' })).toBe(true);
      expect(isEmployeeActive({ status: 'terminated' })).toBe(false);
    });
  });

  describe('Leave Balance Calculation', () => {
    it('should calculate remaining leave days', () => {
      const calculateRemainingLeave = (
        totalAllowance: number,
        usedDays: number,
        pendingDays: number
      ) => {
        return totalAllowance - usedDays - pendingDays;
      };

      expect(calculateRemainingLeave(20, 5, 2)).toBe(13);
      expect(calculateRemainingLeave(15, 15, 0)).toBe(0);
    });

    it('should check if sufficient leave balance', () => {
      const hasSufficientBalance = (requestedDays: number, remainingDays: number) => {
        return requestedDays <= remainingDays;
      };

      expect(hasSufficientBalance(5, 10)).toBe(true);
      expect(hasSufficientBalance(15, 10)).toBe(false);
    });

    it('should calculate leave accrual', () => {
      const calculateMonthlyAccrual = (annualAllowance: number) => {
        return Math.round((annualAllowance / 12) * 10) / 10;
      };

      expect(calculateMonthlyAccrual(24)).toBe(2);
      expect(calculateMonthlyAccrual(20)).toBe(1.7);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate average rating', () => {
      const calculateAverageRating = (ratings: number[]) => {
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        return Math.round((sum / ratings.length) * 10) / 10;
      };

      expect(calculateAverageRating([4, 5, 3, 4])).toBe(4);
      expect(calculateAverageRating([5, 5, 5])).toBe(5);
      expect(calculateAverageRating([])).toBe(0);
    });

    it('should get performance level', () => {
      const getPerformanceLevel = (score: number) => {
        if (score >= 4.5) return 'excellent';
        if (score >= 3.5) return 'good';
        if (score >= 2.5) return 'average';
        if (score >= 1.5) return 'below_average';
        return 'poor';
      };

      expect(getPerformanceLevel(4.8)).toBe('excellent');
      expect(getPerformanceLevel(3.7)).toBe('good');
      expect(getPerformanceLevel(2.8)).toBe('average');
      expect(getPerformanceLevel(1.2)).toBe('poor');
    });
  });

  describe('Payroll Helpers', () => {
    it('should calculate gross salary', () => {
      const calculateGrossSalary = (baseSalary: number, allowances: number, bonus: number) => {
        return baseSalary + allowances + bonus;
      };

      expect(calculateGrossSalary(5000, 500, 1000)).toBe(6500);
      expect(calculateGrossSalary(4000, 0, 0)).toBe(4000);
    });

    it('should calculate net salary', () => {
      const calculateNetSalary = (grossSalary: number, deductions: number, tax: number) => {
        return grossSalary - deductions - tax;
      };

      expect(calculateNetSalary(6000, 500, 600)).toBe(4900);
    });

    it('should calculate tax amount', () => {
      const calculateTax = (grossSalary: number, taxRate: number) => {
        return Math.round(grossSalary * (taxRate / 100));
      };

      expect(calculateTax(5000, 10)).toBe(500);
      expect(calculateTax(10000, 15)).toBe(1500);
    });
  });
});
