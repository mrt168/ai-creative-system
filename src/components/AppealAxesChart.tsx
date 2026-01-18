'use client';

import { APPEAL_AXES, type AppealAxisId } from '@/constants/appeal-axes';

// Define colors for each appeal axis
const AXIS_COLORS: Record<AppealAxisId, string> = {
  spec: 'bg-blue-500',
  quality: 'bg-green-500',
  benefit: 'bg-yellow-500',
  emotion: 'bg-pink-500',
  social: 'bg-purple-500',
  urgency: 'bg-red-500',
  price: 'bg-orange-500',
  ease: 'bg-teal-500',
  authority: 'bg-indigo-500',
};

interface AppealAxesChartProps {
  distribution: Record<string, number>; // axis_id -> percentage
}

export function AppealAxesChart({ distribution }: AppealAxesChartProps) {
  // Sort entries by percentage (descending)
  const sortedEntries = Object.entries(distribution)
    .filter(([, percentage]) => percentage > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        分布データがありません
      </div>
    );
  }

  const maxPercentage = Math.max(...sortedEntries.map(([, p]) => p));

  return (
    <div className="space-y-3">
      {sortedEntries.map(([axisId, percentage]) => {
        const axis = APPEAL_AXES[axisId as AppealAxisId];
        const colorClass = AXIS_COLORS[axisId as AppealAxisId] || 'bg-gray-500';
        // Calculate bar width relative to max value (so the largest is always 100%)
        const barWidth = (percentage / maxPercentage) * 100;

        return (
          <div key={axisId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{axis?.label || axisId}</span>
              <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
            </div>
            <div className="h-4 w-full rounded-full bg-secondary/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
