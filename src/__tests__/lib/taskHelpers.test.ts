import { describe, it, expect } from 'vitest';

// Tests pour les helpers de tâches
describe('Task Helpers', () => {
  describe('Task Status Management', () => {
    it('should validate task status transitions', () => {
      const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
      const isValidStatus = (status: string) => validStatuses.includes(status);
      
      expect(isValidStatus('todo')).toBe(true);
      expect(isValidStatus('done')).toBe(true);
      expect(isValidStatus('invalid')).toBe(false);
    });

    it('should calculate progress percentage', () => {
      const calculateProgress = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
      };
      
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(7, 10)).toBe(70);
      expect(calculateProgress(10, 10)).toBe(100);
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should determine if task is overdue', () => {
      const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
      };
      
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      
      expect(isOverdue(yesterday)).toBe(true);
      expect(isOverdue(tomorrow)).toBe(false);
    });

    it('should calculate task duration in days', () => {
      const calculateDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };
      
      expect(calculateDuration('2025-01-01', '2025-01-08')).toBe(7);
      expect(calculateDuration('2025-01-01', '2025-01-01')).toBe(0);
    });
  });

  describe('Task Priority Management', () => {
    it('should sort tasks by priority', () => {
      type Priority = 'urgent' | 'high' | 'medium' | 'low';
      const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      
      const sortByPriority = (tasks: Array<{ id: string; priority: Priority }>) => {
        return [...tasks].sort((a, b) => {
          const priorityA = priorityOrder[a.priority] ?? 999;
          const priorityB = priorityOrder[b.priority] ?? 999;
          return priorityA - priorityB;
        });
      };
      
      const tasks: Array<{ id: string; priority: Priority }> = [
        { id: '1', priority: 'low' },
        { id: '2', priority: 'urgent' },
        { id: '3', priority: 'medium' }
      ];
      
      const sorted = sortByPriority(tasks);
      expect(sorted[0].id).toBe('2'); // urgent first
      expect(sorted[1].id).toBe('3'); // medium second
      expect(sorted[2].id).toBe('1'); // low last
    });

    it('should get priority color', () => {
      const getPriorityColor = (priority: string) => {
        const colors = {
          urgent: 'red',
          high: 'orange',
          medium: 'yellow',
          low: 'green'
        };
        return colors[priority as keyof typeof colors] || 'gray';
      };
      
      expect(getPriorityColor('urgent')).toBe('red');
      expect(getPriorityColor('high')).toBe('orange');
      expect(getPriorityColor('unknown')).toBe('gray');
    });
  });

  describe('Task Filtering', () => {
    const tasks = [
      { id: '1', status: 'todo', priority: 'high', assignee: 'user1' },
      { id: '2', status: 'in_progress', priority: 'medium', assignee: 'user2' },
      { id: '3', status: 'done', priority: 'low', assignee: 'user1' },
      { id: '4', status: 'todo', priority: 'urgent', assignee: 'user3' }
    ];

    it('should filter tasks by status', () => {
      const filterByStatus = (tasks: any[], status: string) => {
        return tasks.filter(t => t.status === status);
      };
      
      expect(filterByStatus(tasks, 'todo')).toHaveLength(2);
      expect(filterByStatus(tasks, 'done')).toHaveLength(1);
      expect(filterByStatus(tasks, 'in_review')).toHaveLength(0);
    });

    it('should filter tasks by assignee', () => {
      const filterByAssignee = (tasks: any[], assignee: string) => {
        return tasks.filter(t => t.assignee === assignee);
      };
      
      expect(filterByAssignee(tasks, 'user1')).toHaveLength(2);
      expect(filterByAssignee(tasks, 'user2')).toHaveLength(1);
    });

    it('should filter tasks by multiple criteria', () => {
      const filterTasks = (tasks: any[], filters: any) => {
        return tasks.filter(task => {
          if (filters.status && task.status !== filters.status) return false;
          if (filters.priority && task.priority !== filters.priority) return false;
          if (filters.assignee && task.assignee !== filters.assignee) return false;
          return true;
        });
      };
      
      const filtered = filterTasks(tasks, { status: 'todo', priority: 'urgent' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('4');
    });
  });

  describe('Task Statistics', () => {
    const tasks = [
      { status: 'todo', priority: 'high' },
      { status: 'todo', priority: 'medium' },
      { status: 'in_progress', priority: 'high' },
      { status: 'done', priority: 'low' },
      { status: 'done', priority: 'medium' }
    ];

    it('should count tasks by status', () => {
      const countByStatus = (tasks: any[]) => {
        return tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      };
      
      const counts = countByStatus(tasks);
      expect(counts.todo).toBe(2);
      expect(counts.in_progress).toBe(1);
      expect(counts.done).toBe(2);
    });

    it('should count tasks by priority', () => {
      const countByPriority = (tasks: any[]) => {
        return tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      };
      
      const counts = countByPriority(tasks);
      expect(counts.high).toBe(2);
      expect(counts.medium).toBe(2);
      expect(counts.low).toBe(1);
    });

    it('should calculate completion rate', () => {
      const calculateCompletionRate = (tasks: any[]) => {
        const completed = tasks.filter(t => t.status === 'done').length;
        return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      };
      
      expect(calculateCompletionRate(tasks)).toBe(40); // 2/5 = 40%
      expect(calculateCompletionRate([])).toBe(0);
    });
  });

  describe('Task Validation', () => {
    it('should validate task title', () => {
      const isValidTitle = (title: string) => {
        return title && title.trim().length >= 3 && title.length <= 200;
      };
      
      expect(isValidTitle('Valid Task')).toBe(true);
      expect(isValidTitle('AB')).toBe(false); // too short
      expect(isValidTitle('   ')).toBe(false); // empty
      expect(isValidTitle('A'.repeat(201))).toBe(false); // too long
    });

    it('should validate date range', () => {
      const isValidDateRange = (startDate: string, endDate: string) => {
        return new Date(startDate) <= new Date(endDate);
      };
      
      expect(isValidDateRange('2025-01-01', '2025-01-10')).toBe(true);
      expect(isValidDateRange('2025-01-10', '2025-01-01')).toBe(false);
    });

    it('should validate required fields', () => {
      const validateTask = (task: any) => {
        const errors: string[] = [];
        if (!task.title || task.title.trim().length < 3) {
          errors.push('Title is required (min 3 characters)');
        }
        if (!task.status) {
          errors.push('Status is required');
        }
        if (task.start_date && task.end_date && 
            new Date(task.start_date) > new Date(task.end_date)) {
          errors.push('End date must be after start date');
        }
        return { isValid: errors.length === 0, errors };
      };
      
      expect(validateTask({ title: 'Valid', status: 'todo' }).isValid).toBe(true);
      expect(validateTask({ title: 'AB', status: 'todo' }).isValid).toBe(false);
      expect(validateTask({ title: 'Valid' }).isValid).toBe(false);
    });
  });

  describe('Task Hierarchy', () => {
    it('should check if task has subtasks', () => {
      const hasSubtasks = (task: any, allTasks: any[]) => {
        return allTasks.some(t => t.parent_id === task.id);
      };
      
      const tasks = [
        { id: '1', parent_id: null },
        { id: '2', parent_id: '1' },
        { id: '3', parent_id: '1' }
      ];
      
      expect(hasSubtasks({ id: '1' }, tasks)).toBe(true);
      expect(hasSubtasks({ id: '2' }, tasks)).toBe(false);
    });

    it('should get task depth level', () => {
      const getTaskDepth = (task: any, allTasks: any[], depth = 0): number => {
        if (!task.parent_id) return depth;
        const parent = allTasks.find(t => t.id === task.parent_id);
        if (!parent) return depth;
        return getTaskDepth(parent, allTasks, depth + 1);
      };
      
      const tasks = [
        { id: '1', parent_id: null },
        { id: '2', parent_id: '1' },
        { id: '3', parent_id: '2' }
      ];
      
      expect(getTaskDepth({ id: '1', parent_id: null }, tasks)).toBe(0);
      expect(getTaskDepth({ id: '2', parent_id: '1' }, tasks)).toBe(1);
      expect(getTaskDepth({ id: '3', parent_id: '2' }, tasks)).toBe(2);
    });

    it('should get all subtasks recursively', () => {
      const getSubtasks = (taskId: string, allTasks: any[]): any[] => {
        const directChildren = allTasks.filter(t => t.parent_id === taskId);
        const allChildren = [...directChildren];
        directChildren.forEach(child => {
          allChildren.push(...getSubtasks(child.id, allTasks));
        });
        return allChildren;
      };
      
      const tasks = [
        { id: '1', parent_id: null },
        { id: '2', parent_id: '1' },
        { id: '3', parent_id: '1' },
        { id: '4', parent_id: '2' }
      ];
      
      expect(getSubtasks('1', tasks)).toHaveLength(3);
      expect(getSubtasks('2', tasks)).toHaveLength(1);
      expect(getSubtasks('3', tasks)).toHaveLength(0);
    });
  });
});
