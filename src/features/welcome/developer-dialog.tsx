'use client';

import React from 'react';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { FlowPopupHeader } from '@/components/flow-popups/flow-popup-header';
import { FlowPopupFooter } from '@/components/flow-popups/flow-popup-footer';
import { Button } from '@/components/ui/button';

interface DeveloperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperDialog({ isOpen, onClose }: DeveloperDialogProps) {
  return (
    <FlowDialog open={isOpen} onOpenChange={(open) => !open && onClose()} className="p-5 select-none">
      <FlowPopupHeader
        title="Developer Information"
        description="Flow is created by a solo developer."
        onClose={onClose}
      />

      <div className="py-2 space-y-4 text-xs text-left">
        <div className="p-4 bg-muted/40 border rounded-2xl space-y-2">
          <div>
            <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Developer</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">Subhodeep Rajak</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Studio / Team</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">APEX Studio</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Project Concept</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">Local-first, user-owned, open-source personal finance manager.</p>
          </div>
        </div>
      </div>

      <FlowPopupFooter>
        <Button type="button" onClick={onClose} className="w-full h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white btn-premium-touch">
          Close
        </Button>
      </FlowPopupFooter>
    </FlowDialog>
  );
}
