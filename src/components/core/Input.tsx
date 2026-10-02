import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-neutral-400">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
              'focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
              leftAddon && 'pl-9',
              rightAddon && 'pr-9',
              error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-neutral-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
