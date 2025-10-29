/**
 * Composants de Badges - Système de Design Enterprise
 * Inspiré de Linear, Monday.com, Notion, Asana
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// PRIORITY BADGE (Linear/Monday.com style)
// ============================================

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  className,
  showIcon = false 
}) => {
  const styles: Record<Priority, string> = {
    critical: 'bg-priority-critical text-white',
    high: 'bg-priority-high text-white',
    medium: 'bg-priority-medium text-white',
    low: 'bg-priority-low text-white',
  };

  const labels: Record<Priority, string> = {
    critical: showIcon ? '🔥 Critical' : 'Critical',
    high: showIcon ? '⚠️ High' : 'High',
    medium: showIcon ? '➡️ Medium' : 'Medium',
    low: showIcon ? '⬇️ Low' : 'Low',
  };

  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1',
      styles[priority],
      className
    )}>
      {labels[priority]}
    </span>
  );
};

// ============================================
// STATUS BADGE (Monday.com style)
// ============================================

type Status = 'todo' | 'doing' | 'blocked' | 'done' | 'review' | 'backlog';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true 
}) => {
  const styles: Record<Status, string> = {
    todo: 'bg-status-todo text-gray-700 dark:text-gray-200',
    doing: 'bg-status-doing text-white',
    blocked: 'bg-status-blocked text-white',
    done: 'bg-status-done text-white',
    review: 'bg-status-review text-white',
    backlog: 'bg-status-backlog text-gray-600 dark:text-gray-300',
  };

  const labels: Record<Status, string> = {
    todo: showIcon ? '📋 À faire' : 'À faire',
    doing: showIcon ? '⚡ En cours' : 'En cours',
    blocked: showIcon ? '🚫 Bloqué' : 'Bloqué',
    done: showIcon ? '✅ Terminé' : 'Terminé',
    review: showIcon ? '👀 En révision' : 'En révision',
    backlog: showIcon ? '📦 Backlog' : 'Backlog',
  };

  return (
    <span className={cn(
      'px-3 py-1 rounded-md font-medium text-sm inline-flex items-center gap-1',
      styles[status],
      className
    )}>
      {labels[status]}
    </span>
  );
};

// ============================================
// LABEL/TAG (Notion style)
// ============================================

type BadgeColor = 'blue' | 'purple' | 'pink' | 'green' | 'yellow' | 'orange' | 'red' | 'gray';

interface LabelProps {
  color: BadgeColor;
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'outline' | 'light';
}

export const Label: React.FC<LabelProps> = ({ 
  color, 
  children, 
  className,
  variant = 'light'
}) => {
  const variantStyles: Record<string, Record<BadgeColor, string>> = {
    light: {
      blue: 'bg-badge-blue/10 text-badge-blue border-badge-blue/20',
      purple: 'bg-badge-purple/10 text-badge-purple border-badge-purple/20',
      pink: 'bg-badge-pink/10 text-badge-pink border-badge-pink/20',
      green: 'bg-badge-green/10 text-badge-green border-badge-green/20',
      yellow: 'bg-badge-yellow/10 text-badge-yellow border-badge-yellow/20',
      orange: 'bg-badge-orange/10 text-badge-orange border-badge-orange/20',
      red: 'bg-badge-red/10 text-badge-red border-badge-red/20',
      gray: 'bg-badge-gray/10 text-badge-gray border-badge-gray/20',
    },
    solid: {
      blue: 'bg-badge-blue text-white',
      purple: 'bg-badge-purple text-white',
      pink: 'bg-badge-pink text-white',
      green: 'bg-badge-green text-white',
      yellow: 'bg-badge-yellow text-white',
      orange: 'bg-badge-orange text-white',
      red: 'bg-badge-red text-white',
      gray: 'bg-badge-gray text-white',
    },
    outline: {
      blue: 'border-2 border-badge-blue text-badge-blue bg-transparent',
      purple: 'border-2 border-badge-purple text-badge-purple bg-transparent',
      pink: 'border-2 border-badge-pink text-badge-pink bg-transparent',
      green: 'border-2 border-badge-green text-badge-green bg-transparent',
      yellow: 'border-2 border-badge-yellow text-badge-yellow bg-transparent',
      orange: 'border-2 border-badge-orange text-badge-orange bg-transparent',
      red: 'border-2 border-badge-red text-badge-red bg-transparent',
      gray: 'border-2 border-badge-gray text-badge-gray bg-transparent',
    },
  };

  return (
    <span className={cn(
      'px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1',
      variant === 'light' && 'border',
      variantStyles[variant][color],
      className
    )}>
      {children}
    </span>
  );
};

// ============================================
// EMPLOYEE BADGE (Avatar + CDI/CDD)
// ============================================

interface EmployeeBadgeProps {
  name: string;
  contractType?: 'CDI' | 'CDD' | 'Temporaire';
  avatarUrl?: string;
  className?: string;
}

export const EmployeeBadge: React.FC<EmployeeBadgeProps> = ({ 
  name, 
  contractType,
  avatarUrl,
  className 
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const contractColors: Record<string, string> = {
    CDI: 'bg-badge-green/10 text-badge-green',
    CDD: 'bg-badge-orange/10 text-badge-orange',
    Temporaire: 'bg-badge-blue/10 text-badge-blue',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-badge-blue to-badge-purple flex items-center justify-center text-white text-xs font-bold">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      
      {/* Name + Contract */}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name}</span>
        {contractType && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded w-fit',
            contractColors[contractType]
          )}>
            {contractType}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// METRIC CARD (Dashboard Analytics style)
// ============================================

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: BadgeColor;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  className
}) => {
  const colorStyles: Record<BadgeColor, string> = {
    blue: 'bg-badge-blue/10 text-badge-blue',
    purple: 'bg-badge-purple/10 text-badge-purple',
    pink: 'bg-badge-pink/10 text-badge-pink',
    green: 'bg-badge-green/10 text-badge-green',
    yellow: 'bg-badge-yellow/10 text-badge-yellow',
    orange: 'bg-badge-orange/10 text-badge-orange',
    red: 'bg-badge-red/10 text-badge-red',
    gray: 'bg-badge-gray/10 text-badge-gray',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <div className={cn('modern-card p-4 rounded-lg', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('p-3 rounded-lg', colorStyles[color])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              color === 'green' && 'text-badge-green',
              color === 'red' && 'text-badge-red',
              color === 'orange' && 'text-badge-orange',
              color === 'blue' && 'text-badge-blue',
            )}>
              {trend && trendIcons[trend]} {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROGRESS BAR (Linear style)
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: BadgeColor;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  showLabel = true,
  size = 'md',
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorStyles: Record<BadgeColor, string> = {
    blue: 'bg-status-doing',
    purple: 'bg-badge-purple',
    pink: 'bg-badge-pink',
    green: 'bg-status-done',
    yellow: 'bg-status-review',
    orange: 'bg-badge-orange',
    red: 'bg-status-blocked',
    gray: 'bg-badge-gray',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progression</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('bg-muted rounded-full overflow-hidden', sizeStyles[size])}>
        <div 
          className={cn('h-full rounded-full transition-all duration-300', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
