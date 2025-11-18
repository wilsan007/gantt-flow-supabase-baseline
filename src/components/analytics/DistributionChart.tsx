/**
 * Distribution Chart - Graphique de distribution simple
 * Pattern: Stripe/Linear - Visualisations épurées
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionData {
  name: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  title: string;
  data: DistributionData[];
  height?: number;
  showLegend?: boolean;
}

// Palette de couleurs moderne (inspirée de Linear/Notion)
const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="border-border bg-popover rounded-lg border p-3 shadow-lg">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {data.value} ({((data.value / data.payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  data,
  height = 300,
  showLegend = true,
}) => {
  // Calculer le total pour le tooltip
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            <p className="text-sm">Aucune donnée à afficher</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
