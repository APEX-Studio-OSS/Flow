'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FlowPopupFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FlowPopupFooter({ children, className, ...props }: FlowPopupFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
