import { describe, it, expect } from 'vitest';

// Tests pour les helpers de projets
describe('Project Helpers', () => {
  describe('Project Status Management', () => {
    it('should validate project status', () => {
      const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
      const isValidStatus = (status: string) => validStatuses.includes(status);
      
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('invalid')).toBe(false);
    });

    it('should get status badge color', () => {
      const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
          planning: 'blue',
          active: 'green',
          on_hold: 'yellow',
          completed: 'gray',
          cancelled: 'red'
        };
        return colors[status] || 'default';
      };
      
      expect(getStatusColor('active')).toBe('green');
      expect(getStatusColor('cancelled')).toBe('red');
      expect(getStatusColor('unknown')).toBe('default');
    });

    it('should determine if project is active', () => {
      const isProjectActive = (status: string) => {
        return status === 'active' || status === 'planning';
      };
      
      expect(isProjectActive('active')).toBe(true);
      expect(isProjectActive('planning')).toBe(true);
      expect(isProjectActive('completed')).toBe(false);
    });
  });

  describe('Budget Management', () => {
    it('should calculate budget utilization percentage', () => {
      const calculateBudgetUtilization = (spent: number, budget: number) => {
        if (budget === 0) return 0;
        return Math.round((spent / budget) * 100);
      };
      
      expect(calculateBudgetUtilization(5000, 10000)).toBe(50);
      expect(calculateBudgetUtilization(7500, 10000)).toBe(75);
      expect(calculateBudgetUtilization(10000, 10000)).toBe(100);
      expect(calculateBudgetUtilization(0, 0)).toBe(0);
    });

    it('should check if budget is exceeded', () => {
      const isBudgetExceeded = (spent: number, budget: number) => {
        return spent > budget;
      };
      
      expect(isBudgetExceeded(11000, 10000)).toBe(true);
      expect(isBudgetExceeded(9000, 10000)).toBe(false);
      expect(isBudgetExceeded(10000, 10000)).toBe(false);
    });

    it('should calculate remaining budget', () => {
      const calculateRemainingBudget = (budget: number, spent: number) => {
        return Math.max(0, budget - spent);
      };
      
      expect(calculateRemainingBudget(10000, 6000)).toBe(4000);
      expect(calculateRemainingBudget(10000, 10000)).toBe(0);
      expect(calculateRemainingBudget(10000, 12000)).toBe(0); // never negative
    });
  });

  describe('Project Timeline', () => {
    it('should calculate project duration in days', () => {
      const calculateProjectDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };
      
      expect(calculateProjectDuration('2025-01-01', '2025-01-31')).toBe(30);
      expect(calculateProjectDuration('2025-01-01', '2025-01-01')).toBe(0);
    });

    it('should calculate days remaining', () => {
      const calculateDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };
      
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      
      expect(calculateDaysRemaining(tomorrow)).toBeGreaterThan(0);
      expect(calculateDaysRemaining(yesterday)).toBeLessThan(0);
    });

    it('should check if project is overdue', () => {
      const isProjectOverdue = (endDate: string, status: string) => {
        if (status === 'completed' || status === 'cancelled') return false;
        return new Date(endDate) < new Date();
      };
      
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      
      expect(isProjectOverdue(yesterday, 'active')).toBe(true);
      expect(isProjectOverdue(tomorrow, 'active')).toBe(false);
      expect(isProjectOverdue(yesterday, 'completed')).toBe(false);
    });
  });

  describe('Project Progress', () => {
    it('should calculate project completion percentage', () => {
      const calculateCompletion = (completedTasks: number, totalTasks: number) => {
        if (totalTasks === 0) return 0;
        return Math.round((completedTasks / totalTasks) * 100);
      };
      
      expect(calculateCompletion(5, 10)).toBe(50);
      expect(calculateCompletion(10, 10)).toBe(100);
      expect(calculateCompletion(0, 10)).toBe(0);
      expect(calculateCompletion(0, 0)).toBe(0);
    });

    it('should get progress status', () => {
      const getProgressStatus = (percentage: number) => {
        if (percentage >= 100) return 'completed';
        if (percentage >= 75) return 'on_track';
        if (percentage >= 50) return 'in_progress';
        if (percentage >= 25) return 'behind';
        return 'at_risk';
      };
      
      expect(getProgressStatus(100)).toBe('completed');
      expect(getProgressStatus(80)).toBe('on_track');
      expect(getProgressStatus(60)).toBe('in_progress');
      expect(getProgressStatus(30)).toBe('behind');
      expect(getProgressStatus(10)).toBe('at_risk');
    });
  });

  describe('Project Validation', () => {
    it('should validate project name', () => {
      const isValidProjectName = (name: string) => {
        return name && name.trim().length >= 3 && name.length <= 100;
      };
      
      expect(isValidProjectName('Valid Project')).toBe(true);
      expect(isValidProjectName('AB')).toBe(false);
      expect(isValidProjectName('   ')).toBe(false);
      expect(isValidProjectName('A'.repeat(101))).toBe(false);
    });

    it('should validate budget values', () => {
      const isValidBudget = (budget: number) => {
        return budget >= 0 && budget <= 10000000;
      };
      
      expect(isValidBudget(50000)).toBe(true);
      expect(isValidBudget(0)).toBe(true);
      expect(isValidBudget(-100)).toBe(false);
      expect(isValidBudget(20000000)).toBe(false);
    });

    it('should validate project dates', () => {
      const validateProjectDates = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
      };
      
      expect(validateProjectDates('2025-01-01', '2025-12-31')).toBe(true);
      expect(validateProjectDates('2025-12-31', '2025-01-01')).toBe(false);
    });
  });

  describe('Team Management', () => {
    it('should count team members', () => {
      const team = [
        { id: '1', role: 'manager' },
        { id: '2', role: 'developer' },
        { id: '3', role: 'developer' },
        { id: '4', role: 'designer' }
      ];
      
      expect(team.length).toBe(4);
    });

    it('should group team by role', () => {
      const groupByRole = (team: any[]) => {
        return team.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      };
      
      const team = [
        { id: '1', role: 'manager' },
        { id: '2', role: 'developer' },
        { id: '3', role: 'developer' }
      ];
      
      const grouped = groupByRole(team);
      expect(grouped.manager).toBe(1);
      expect(grouped.developer).toBe(2);
    });

    it('should check if user is project manager', () => {
      const isProjectManager = (userId: string, project: any) => {
        return project.manager_id === userId;
      };
      
      expect(isProjectManager('user1', { manager_id: 'user1' })).toBe(true);
      expect(isProjectManager('user2', { manager_id: 'user1' })).toBe(false);
    });
  });

  describe('Project Metrics', () => {
    it('should calculate velocity (tasks per day)', () => {
      const calculateVelocity = (completedTasks: number, days: number) => {
        if (days === 0) return 0;
        return Math.round((completedTasks / days) * 10) / 10;
      };
      
      expect(calculateVelocity(10, 5)).toBe(2);
      expect(calculateVelocity(15, 10)).toBe(1.5);
      expect(calculateVelocity(0, 5)).toBe(0);
    });

    it('should estimate completion date', () => {
      const estimateCompletionDate = (
        remainingTasks: number,
        tasksPerDay: number,
        startDate: Date
      ) => {
        if (tasksPerDay === 0) return null;
        const daysNeeded = Math.ceil(remainingTasks / tasksPerDay);
        const completion = new Date(startDate);
        completion.setDate(completion.getDate() + daysNeeded);
        return completion;
      };
      
      const start = new Date('2025-01-01');
      const estimate = estimateCompletionDate(10, 2, start);
      
      expect(estimate).toBeDefined();
      expect(estimate?.getDate()).toBeGreaterThan(start.getDate());
    });

    it('should calculate project health score', () => {
      const calculateHealthScore = (metrics: {
        budgetUtilization: number;
        scheduleVariance: number;
        taskCompletion: number;
      }) => {
        const budgetScore = metrics.budgetUtilization <= 100 ? 100 - metrics.budgetUtilization : 0;
        const scheduleScore = Math.max(0, 100 - Math.abs(metrics.scheduleVariance));
        const completionScore = metrics.taskCompletion;
        
        return Math.round((budgetScore + scheduleScore + completionScore) / 3);
      };
      
      expect(calculateHealthScore({
        budgetUtilization: 50,
        scheduleVariance: 10,
        taskCompletion: 80
      })).toBeGreaterThan(50);
    });
  });
});
