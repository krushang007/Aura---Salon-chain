import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary: 'bg-[#111111] text-white hover:bg-[#262626] active:bg-[#000000] shadow-sm',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200',
      outline: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-xs',
      ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      subtle: 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-11 px-5 text-sm rounded-lg gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0 rounded-lg justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
