type CloseHandler = () => void;

interface OverlayEntry {
  id: string;
  close: CloseHandler;
  priority: number;
  ownerPath?: string;
  isModal?: boolean;
  dismissOnBackground?: boolean;
}

let stack: OverlayEntry[] = [];
const subscribers = new Set<(count: number) => void>();

export const OverlayStack = {
  getStackInfo() {
    return {
      count: stack.length,
      top: stack[stack.length - 1]?.id || null,
      entries: stack.map(item => ({ id: item.id, priority: item.priority, ownerPath: item.ownerPath }))
    };
  },

  getOverlayCount(): number {
    return stack.length;
  },

  subscribe(callback: (count: number) => void) {
    subscribers.add(callback);
    // Initial call
    callback(stack.length);
    return () => {
      subscribers.delete(callback);
    };
  },

  notifySubscribers() {
    const count = stack.length;
    subscribers.forEach(cb => {
      try {
        cb(count);
      } catch (err) {
        console.error('Error in OverlayStack subscriber:', err);
      }
    });
  },

  register(id: string, close: CloseHandler, priority = 0, ownerPath?: string, isModal = true, dismissOnBackground = true) {
    this.unregister(id);
    const resolvedPath = ownerPath || (typeof window !== 'undefined' ? window.location.pathname : undefined);
    stack.push({ id, close, priority, ownerPath: resolvedPath, isModal, dismissOnBackground });
    this.updateOverlayActiveBodyClass();
  },

  unregister(id: string) {
    stack = stack.filter(item => item.id !== id);
    this.updateOverlayActiveBodyClass();
  },

  closeTop(): boolean {
    if (stack.length === 0) return false;
    const top = stack[stack.length - 1];
    if (top) {
      top.close();
      return true;
    }
    return false;
  },

  hasOverlays(): boolean {
    return stack.length > 0;
  },

  hasModalOverlay(): boolean {
    return stack.some(item => item.isModal !== false);
  },

  closeAll() {
    // Separate dismissible vs non-dismissible entries
    const toClose = stack.filter(item => item.dismissOnBackground !== false);
    stack = stack.filter(item => item.dismissOnBackground === false);

    // Call close handlers in reverse order (LIFO) for those we are closing
    for (let i = toClose.length - 1; i >= 0; i--) {
      const entry = toClose[i];
      try {
        entry.close();
      } catch (e) {
        console.error(`Error closing overlay ${entry.id}:`, e);
      }
    }
    this.updateOverlayActiveBodyClass();
  },

  clear() {
    stack = [];
    this.updateOverlayActiveBodyClass();
  },

  clearPageScoped(currentPath: string) {
    stack = stack.filter(item => {
      // Keep entries that do not have an ownerPath or whose ownerPath matches the current path
      return !item.ownerPath || item.ownerPath === currentPath;
    });
    this.updateOverlayActiveBodyClass();
  },

  updateOverlayActiveBodyClass() {
    if (typeof document === 'undefined') return;
    const hasModalOverlay = stack.some(item => item.isModal !== false);
    if (hasModalOverlay) {
      document.body.classList.add('overlay-active');
    } else {
      document.body.classList.remove('overlay-active');
      // Delayed check to guarantee Radix UI cleanups have completed
      setTimeout(() => {
        const hasOverlayStill = stack.some(item => item.isModal !== false) || !!document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (!hasOverlayStill) {
          document.body.style.pointerEvents = '';
          document.body.style.overflow = '';
        }
      }, 0);
    }
    this.notifySubscribers();
  }
};

if (typeof window !== 'undefined') {
  (window as any).OverlayStack = OverlayStack;
}
