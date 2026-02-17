'use client';

import { forwardRef, HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value, showLabel = false, size = 'md', ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    const sizes = {
      sm: 'h-1',
      md: 'h-1.5',
    };

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div className={`w-full overflow-hidden rounded-full bg-gray-100 ${sizes[size]}`}>
          <div
            className={`${sizes[size]} bg-black transition-all duration-300 ease-out`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-2 text-right text-sm text-gray-500">
            {Math.round(clampedValue)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

interface ScoreBarProps extends HTMLAttributes<HTMLDivElement> {
  score: number; // 1-5
  maxScore?: number;
}

export const ScoreBar = forwardRef<HTMLDivElement, ScoreBarProps>(
  ({ className = '', score, maxScore = 5, ...props }, ref) => {
    const percentage = (score / maxScore) * 100;

    return (
      <div ref={ref} className={`flex items-center gap-3 ${className}`} {...props}>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-1.5 bg-black transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-right font-mono text-sm">{score.toFixed(1)}</span>
      </div>
    );
  }
);

ScoreBar.displayName = 'ScoreBar';
