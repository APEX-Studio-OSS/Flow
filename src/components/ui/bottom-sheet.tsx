"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOverlay } from "@/components/providers/overlay-provider"
import { OverlayStackManager } from "./overlay-stack-manager"

const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetPortal = DialogPrimitive.Portal
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[50] bg-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const stableId = React.useId().replace(/:/g, '');
  const [sheetId] = React.useState(() => `sheet-${Math.random().toString(36).substring(2, 9)}`);
  const instanceId = React.useMemo(() => `global:${stableId}`, [stableId]);
  const { registerOverlay, unregisterOverlay } = useOverlay();

  React.useEffect(() => {
    registerOverlay(sheetId, instanceId);
    return () => {
      unregisterOverlay(sheetId, instanceId);
    };
  }, [sheetId, instanceId, registerOverlay, unregisterOverlay]);
  
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
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed bottom-0 left-[50%] z-[60] flex w-full max-w-[430px] translate-x-[-50%] flex-col gap-4 border-t border-border bg-card p-6 pb-[calc(1.5rem+var(--safe-area-bottom))] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full rounded-t-[32px] max-h-[85dvh] overflow-y-auto focus:outline-none",
          className
        )}
        {...props}
      >
        <OverlayStackManager id={sheetId} close={handleClose} priority={1} />
        {/* Drag handle affordance */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2 flex-shrink-0" />
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground h-10 w-10 flex items-center justify-center">
          <X className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  );
})
BottomSheetContent.displayName = DialogPrimitive.Content.displayName

const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
BottomSheetHeader.displayName = "BottomSheetHeader"

const BottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
BottomSheetFooter.displayName = "BottomSheetFooter"

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
}
