import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'destructive' | 'outline';
  dot?: boolean;
}

export const Badge = ({
  className,
  variant = 'neutral',
  dot = false,
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    outline: 'bg-transparent text-neutral-700 border-neutral-300',
  };

  const dotColors = {
    neutral: 'bg-neutral-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
    outline: 'bg-neutral-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
