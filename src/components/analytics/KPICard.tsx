/**
 * KPI Card - Carte de métrique avec tendance
 * Pattern: Stripe/Monday.com - KPIs clairs et visuels
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
  className?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  className,
  format = 'number',
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    destructive: 'text-red-600 bg-red-50',
    accent: 'text-blue-600 bg-blue-50',
  };

  const iconColorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600',
    accent: 'text-blue-600',
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'duration':
        return `${val}j`;
      default:
        return val.toLocaleString('fr-FR');
    }
  };

  const TrendIcon = trend
    ? trend.value === 0
      ? Minus
      : trend.isPositive
        ? TrendingUp
        : TrendingDown
    : null;

  return (
    <Card className={cn('modern-card hover-glow transition-all duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn('text-3xl font-bold', iconColorClasses[color])}>
                {formatValue(value)}
              </p>
              {trend && TrendIcon && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    trend.value === 0
                      ? 'text-muted-foreground'
                      : trend.isPositive
                        ? 'text-green-600'
                        : 'text-red-600'
                  )}
                >
                  <TrendIcon className="h-4 w-4" />
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {trend?.label && <p className="mt-2 text-xs text-muted-foreground">{trend.label}</p>}
          </div>
          <div className={cn('rounded-lg p-3', colorClasses[color])}>
            <Icon className={cn('h-6 w-6', iconColorClasses[color])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
