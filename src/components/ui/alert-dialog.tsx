
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { useOverlay } from "@/components/providers/overlay-provider"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { OverlayStackManager } from "./overlay-stack-manager"

const AlertDialogOpenContext = React.createContext<{ open: boolean; sessionId: string }>({ open: false, sessionId: '' });

function AlertDialog({ open: openProp, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>) {
  const [openState, setOpenState] = React.useState(defaultOpen || false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;

  const handleOpenChange = React.useCallback((next: boolean) => {
    if (!isControlled) {
      setOpenState(next);
    }
    onOpenChange?.(next);
  }, [isControlled, onOpenChange]);

  const componentInstanceId = React.useId().replace(/:/g, '');
  const generationRef = React.useRef(0);
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [sessionId, setSessionId] = React.useState(() => {
    return open ? `${componentInstanceId}-${++generationRef.current}` : '';
  });

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSessionId(`${componentInstanceId}-${++generationRef.current}`);
    }
  }

  return (
    <AlertDialogOpenContext.Provider value={{ open, sessionId }}>
      <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </AlertDialogOpenContext.Provider>
  );
}

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[50] bg-transparent dialog-overlay-animate",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

function useForkRef<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> | null {
  return React.useMemo(() => {
    if (refs.every((ref) => ref == null)) {
      return null;
    }
    return (value) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(value);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      });
    };
  }, [refs]);
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & { id?: string; ownerId?: string; onExitComplete?: () => void }
>(({ className, children, id, ownerId, onAnimationEnd, onExitComplete, ...props }, ref) => {
  const [dialogId] = React.useState(() => id || `dialog-${Math.random().toString(36).substring(2, 9)}`);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const forkedRef = useForkRef(ref, innerRef);

  const { sessionId } = React.useContext(AlertDialogOpenContext);
  const { registerOverlay, unregisterOverlay } = useOverlay();

  React.useEffect(() => {
    if (sessionId) {
      registerOverlay(dialogId, sessionId, ownerId);
      return () => {
        unregisterOverlay(dialogId, sessionId);
        onExitComplete?.();
      };
    }
  }, [dialogId, sessionId, ownerId, registerOverlay, unregisterOverlay, onExitComplete]);
  
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
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={forkedRef}
        onAnimationEnd={onAnimationEnd}
        className={cn(
          "fixed left-[50%] top-[50%] z-[70] grid w-[calc(100%-32px)] max-w-[430px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-2xl rounded-[24px] dialog-content-animate",
          className
        )}
        {...props}
      >
        <OverlayStackManager id={dialogId} close={handleClose} priority={1} />
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
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
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
