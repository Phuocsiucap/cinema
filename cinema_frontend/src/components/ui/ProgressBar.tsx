import { useState } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  showText?: boolean;
}

const ProgressBar = ({ current, total, className = '', showText = true }: ProgressBarProps) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Used</span>
          <span>{current}/{total}</span>
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            percentage >= 100
              ? 'bg-red-500'
              : percentage >= 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;