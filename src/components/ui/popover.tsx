"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { OverlayStack } from "@/lib/overlay-stack"
import { cn } from "@/lib/utils"
import { useOverlay } from "@/components/providers/overlay-provider"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

import { OverlayStackManager } from "./overlay-stack-manager"

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const stableId = React.useId().replace(/:/g, '');
  const [popoverId] = React.useState(() => `popover-${Math.random().toString(36).substring(2, 9)}`);
  const instanceId = React.useMemo(() => `global:${stableId}`, [stableId]);
  const { registerOverlay, unregisterOverlay } = useOverlay();

  React.useEffect(() => {
    registerOverlay(popoverId, instanceId);
    return () => {
      unregisterOverlay(popoverId, instanceId);
    };
  }, [popoverId, instanceId, registerOverlay, unregisterOverlay]);
  
  const handleClose = React.useCallback(() => {
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(escEvent);
  }, []);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[60] w-72 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        <OverlayStackManager id={popoverId} close={handleClose} priority={1} />
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
