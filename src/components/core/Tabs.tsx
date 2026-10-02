'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export function Tabs({ items, activeId, onChange, className, variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex rounded-lg bg-neutral-100 p-1 text-sm font-medium', className)}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px]',
                    isActive ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-200 text-neutral-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex border-b border-neutral-200 text-sm font-medium gap-6', className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-3 text-sm transition-colors flex items-center gap-2',
              isActive
                ? 'font-semibold text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
