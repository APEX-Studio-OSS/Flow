
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useOverlay } from "@/components/providers/overlay-provider"

import { cn } from "@/lib/utils"

const DialogOpenContext = React.createContext<{ open: boolean; sessionId: string }>({ open: false, sessionId: '' });

function Dialog({ open: openProp, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
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
    <DialogOpenContext.Provider value={{ open, sessionId }}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </DialogOpenContext.Provider>
  );
}

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[50] bg-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
)))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

import { OverlayStackManager } from "./overlay-stack-manager"

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

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { id?: string; ownerId?: string; onExitComplete?: () => void }
>(({ className, children, id, ownerId, onAnimationEnd, onExitComplete, ...props }, ref) => {
  const [dialogId] = React.useState(() => id || `dialog-${Math.random().toString(36).substring(2, 9)}`);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const forkedRef = useForkRef(ref, innerRef);

  const { sessionId } = React.useContext(DialogOpenContext);
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
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={forkedRef}
        onAnimationEnd={onAnimationEnd}
        className={cn(
          "fixed left-[50%] top-[50%] z-[60] grid w-[calc(100%-32px)] max-w-[430px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[24px]",
          className
        )}
        {...props}
      >
        <OverlayStackManager id={dialogId} close={handleClose} priority={1} />
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground h-10 w-10 flex items-center justify-center">
          <X className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
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
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
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
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
