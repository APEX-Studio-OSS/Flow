
'use client';

import { tv } from 'tailwind-variants';
import { Globe, ServerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const badge = tv({
  base: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  variants: {
    type: {
      online: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      offline: 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300',
    },
  },
});

interface TransactionTypeBadgeProps {
  isOnline: boolean;
  className?: string;
}

export function TransactionTypeBadge({ isOnline, className }: TransactionTypeBadgeProps) {
  const type = isOnline ? 'online' : 'offline';
  const Icon = isOnline ? Globe : ServerOff;
  const text = isOnline ? 'Online' : 'Offline';

  return (
    <div className={cn(badge({ type }), className)}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
}
