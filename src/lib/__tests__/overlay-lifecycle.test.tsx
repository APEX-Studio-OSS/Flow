import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const reactPath = require.resolve('react');
const originalReact = require('react');

// Create a mutable copy of React
const mockReact = { ...originalReact };

// Setup global DOM mocks
if (typeof global.window === 'undefined') {
  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: {
      pathname: '/',
    },
  } as any;
}

if (typeof global.document === 'undefined') {
  global.document = {
    body: {
      classList: {
        add: () => {},
        remove: () => {},
      },
      style: {
        pointerEvents: '',
        overflow: '',
      },
    },
    querySelectorAll: () => [] as any,
    querySelector: () => null,
    dispatchEvent: () => {},
  } as any;
}

// Mock OverlayInstance type
export type OverlayInstance = {
  overlayId: string;
  instanceId: string;
  ownerId?: string;
};

// Mock OverlayProvider state machine logic
class MockOverlayProvider {
  activeOverlayInstances = new Map<string, Set<OverlayInstance>>();
  dimmingCallsCount = 0;
  undimmingCallsCount = 0;
  lastIsDimmed = false;

  registerOverlay(overlayId: string, instanceId: string, ownerId?: string) {
    if (process.env.FLOW_TEST_DEBUG === '1') {
      console.log(`[TEST_LOG] registerOverlay overlayId=${overlayId} instanceId=${instanceId}`);
    }
    const instances = this.activeOverlayInstances.get(overlayId) || new Set<OverlayInstance>();
    
    let exists = false;
    instances.forEach((inst) => {
      if (inst.instanceId === instanceId) {
        exists = true;
      }
    });

    if (!exists) {
      instances.add({ overlayId, instanceId, ownerId });
      this.activeOverlayInstances.set(overlayId, instances);
      this.reconcileDimming();
    }
  }

  unregisterOverlay(overlayId: string, instanceId: string) {
    if (process.env.FLOW_TEST_DEBUG === '1') {
      console.log(`[TEST_LOG] unregisterOverlay overlayId=${overlayId} instanceId=${instanceId}`);
    }
    const instances = this.activeOverlayInstances.get(overlayId);
    if (instances) {
      const updated = new Set(instances);
      let targetInst: OverlayInstance | null = null;
      updated.forEach((inst) => {
        if (inst.instanceId === instanceId) {
          targetInst = inst;
        }
      });
      if (targetInst) {
        updated.delete(targetInst);
        if (updated.size === 0) {
          this.activeOverlayInstances.delete(overlayId);
        } else {
          this.activeOverlayInstances.set(overlayId, updated);
        }
        this.reconcileDimming();
      }
    }
  }

  unregisterOverlayOwner(ownerId: string) {
    let changed = false;
    this.activeOverlayInstances.forEach((instances, overlayId) => {
      const updated = new Set(instances);
      updated.forEach((inst) => {
        if (inst.ownerId === ownerId) {
          updated.delete(inst);
          changed = true;
        }
      });
      if (updated.size === 0) {
        this.activeOverlayInstances.delete(overlayId);
      } else {
        this.activeOverlayInstances.set(overlayId, updated);
      }
    });
    if (changed) {
      this.reconcileDimming();
    }
  }

  get totalInstancesCount() {
    let count = 0;
    this.activeOverlayInstances.forEach((instances) => {
      count += instances.size;
    });
    return count;
  }

  reconcileDimming() {
    const isDimmed = this.totalInstancesCount > 0;
    if (isDimmed && !this.lastIsDimmed) {
      this.dimmingCallsCount++;
    } else if (!isDimmed && this.lastIsDimmed) {
      this.undimmingCallsCount++;
    }
    this.lastIsDimmed = isDimmed;
  }
}

// Global active provider for context
let currentProvider = new MockOverlayProvider();

const mockOverlayContext = {
  get activeOverlayIds() {
    const ids = new Set<string>();
    currentProvider.activeOverlayInstances.forEach((instances, id) => {
      if (instances.size > 0) {
        ids.add(id);
      }
    });
    return ids;
  },
  registerOverlay: (overlayId: string, instanceId: string, ownerId?: string) => {
    currentProvider.registerOverlay(overlayId, instanceId, ownerId);
  },
  unregisterOverlay: (overlayId: string, instanceId: string) => {
    currentProvider.unregisterOverlay(overlayId, instanceId);
  },
  unregisterOverlayOwner: (ownerId: string) => {
    currentProvider.unregisterOverlayOwner(ownerId);
  },
  get hasActiveOverlay() {
    return currentProvider.totalInstancesCount > 0;
  },
  resolvedTheme: 'light',
  colorThemeName: 'emerald',
};

// Override the Node module cache for react
require.cache[reactPath] = {
  id: reactPath,
  filename: reactPath,
  loaded: true,
  exports: mockReact,
} as any;

// Mock useOverlay and RegisteredOverlaySession
const overlayProviderPath = require.resolve('../../components/providers/overlay-provider');
require.cache[overlayProviderPath] = {
  id: overlayProviderPath,
  filename: overlayProviderPath,
  loaded: true,
  exports: {
    useOverlay: () => mockOverlayContext,
    RegisteredOverlaySession: ({ overlayId, instanceId, ownerId, children }: any) => {
      const { registerOverlay, unregisterOverlay } = mockOverlayContext;
      mockReact.useEffect(() => {
        registerOverlay(overlayId, instanceId, ownerId);
        return () => {
          unregisterOverlay(overlayId, instanceId);
        };
      }, [overlayId, instanceId, ownerId]);
      return children;
    }
  }
} as any;

// Mock Radix Dialog components
const mockRadixDialog = {
  Root: ({ children, open, onOpenChange }: any) => {
    return children;
  },
  Portal: ({ children }: any) => children,
  Overlay: originalReact.forwardRef(({ children, ...props }: any, ref: any) => {
    return originalReact.createElement('div', { ref, ...props }, children);
  }),
  Content: originalReact.forwardRef(({ children, ...props }: any, ref: any) => {
    return originalReact.createElement('div', { ref, ...props }, children);
  }),
  Title: originalReact.forwardRef(({ children, ...props }: any, ref: any) => {
    return originalReact.createElement('span', { ref, ...props }, children);
  }),
};
require.cache[require.resolve('@radix-ui/react-dialog')] = {
  id: require.resolve('@radix-ui/react-dialog'),
  filename: require.resolve('@radix-ui/react-dialog'),
  loaded: true,
  exports: mockRadixDialog,
} as any;

// Mock Framer Motion
const exitingCallbacks = new Map<string, () => void>();
const mockFramerMotion = {
  motion: {
    div: originalReact.forwardRef(({ children, className, style, ...props }: any, ref: any) => {
      return originalReact.createElement('div', { ref, className, style, ...props }, children);
    }),
  },
  AnimatePresence: ({ children, onExitComplete }: any) => {
    const [renderedChildren, setRenderedChildren] = mockReact.useState([] as any[]);
    const [exitingKeys, setExitingKeys] = mockReact.useState(new Set() as Set<string>);

    const childrenArray = mockReact.Children.toArray(children);
    const keysStr = childrenArray.map((c: any) => c && c.key !== null ? String(c.key).replace(/^\.\$/, '') : '').join(',');
    const prevKeysRef = mockReact.useRef('');

    mockReact.useEffect(() => {
      if (prevKeysRef.current === keysStr) return;
      prevKeysRef.current = keysStr;

      const nextChildren = [...childrenArray];
      
      renderedChildren.forEach((child: any) => {
        if (child && child.key !== null) {
          const keyStr = String(child.key).replace(/^\.\$/, '');
          const stillExists = childrenArray.some((c: any) => c && String(c.key).replace(/^\.\$/, '') === keyStr);
          if (!stillExists) {
            if (!exitingKeys.has(keyStr)) {
              exitingKeys.add(keyStr);
              setExitingKeys(new Set(exitingKeys));
            }
            nextChildren.push(child);
          }
        }
      });

      setRenderedChildren(nextChildren);
    }, [keysStr]);

    mockReact.useEffect(() => {
      exitingKeys.forEach((key: string) => {
        if (!exitingCallbacks.has(key)) {
          exitingCallbacks.set(key, () => {
            exitingKeys.delete(key);
            setExitingKeys(new Set(exitingKeys));
            setRenderedChildren((prev: any[]) => prev.filter((c: any) => c && String(c.key).replace(/^\.\$/, '') !== key));
            if (onExitComplete) {
              onExitComplete();
            }
          });
        }
      });
    }, [exitingKeys, onExitComplete]);

    return originalReact.createElement(originalReact.Fragment, null, renderedChildren);
  },
  useReducedMotion: () => false,
  usePresence: () => [true, () => {}],
};
require.cache[require.resolve('framer-motion')] = {
  id: require.resolve('framer-motion'),
  filename: require.resolve('framer-motion'),
  loaded: true,
  exports: mockFramerMotion,
} as any;

// Traversal and Hooks Simulator
let currentComponentState: any = null;
let activeSimulator: ReactSimulator | null = null;

class ReactSimulator {
  componentStates = new Map<string, any>();
  previousPaths = new Set<string>();
  currentPaths = new Set<string>();
  pendingEffects: Array<{ state: any; index: number; effect: () => any }> = [];
  needsRerender = false;
  idCounter = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.componentStates.clear();
    this.previousPaths.clear();
    this.currentPaths.clear();
    this.pendingEffects = [];
    this.needsRerender = false;
    this.idCounter = 0;
  }

  run(renderFn: () => React.ReactElement) {
    activeSimulator = this;
    let loopCount = 0;
    do {
      this.needsRerender = false;
      this.currentPaths.clear();
      
      const tree = renderFn();
      this.traverse(tree, []);
      
      // Handle unmount cleanups
      this.previousPaths.forEach(path => {
        if (!this.currentPaths.has(path)) {
          const state = this.componentStates.get(path);
          if (state) {
            state.hooks.forEach((hook: any) => {
              if (hook && hook.cleanup) {
                try { hook.cleanup(); } catch (e) {}
              }
            });
            this.componentStates.delete(path);
          }
        }
      });
      
      this.previousPaths = new Set(this.currentPaths);
      
      // Run pending effects
      const effects = this.pendingEffects;
      this.pendingEffects = [];
      
      effects.forEach(item => {
        const hook = item.state.hooks[item.index];
        if (hook.cleanup) {
          try { hook.cleanup(); } catch (e) {}
        }
        const cleanup = item.effect();
        hook.cleanup = typeof cleanup === 'function' ? cleanup : null;
      });
      
      loopCount++;
      if (loopCount > 30) {
        throw new Error('Infinite rerender loop detected');
      }
    } while (this.needsRerender);
    activeSimulator = null;
  }

  traverse(element: any, pathStack: string[]) {
    if (!element) return;
    if (typeof element === 'string' || typeof element === 'number') return;
    if (Array.isArray(element)) {
      element.forEach((child, index) => this.traverse(child, [...pathStack, `[${index}]`]));
      return;
    }
    
    const type = element.type;
    const props = element.props || {};
    const key = element.key !== null && element.key !== undefined ? `:${element.key}` : '';
    
    if (typeof type === 'function') {
      const typeName = type.name || type.displayName || 'Anonymous';
      const path = [...pathStack, typeName + key].join('.');
      this.currentPaths.add(path);
      
      let state = this.componentStates.get(path);
      if (!state) {
        state = {
          hooks: [],
          hookIndex: 0,
        };
        this.componentStates.set(path, state);
      }
      
      const oldState = currentComponentState;
      currentComponentState = state;
      state.hookIndex = 0;
      
      try {
        const rendered = type(props);
        this.traverse(rendered, [...pathStack, typeName + key]);
      } finally {
        currentComponentState = oldState;
      }
    } else {
      const children = props.children;
      if (children) {
        if (Array.isArray(children)) {
          children.forEach((child, index) => this.traverse(child, [...pathStack, `host[${index}]`]));
        } else {
          this.traverse(children, [...pathStack, 'host']);
        }
      }
    }
  }
}

// Override original React hooks to interface with simulator
mockReact.useState = (initialValue: any) => {
  const state = currentComponentState;
  const index = state.hookIndex++;
  if (state.hooks.length <= index) {
    const val = typeof initialValue === 'function' ? initialValue() : initialValue;
    state.hooks.push(val);
  }
  const value = state.hooks[index];
  const setValue = (newValue: any) => {
    const nextVal = typeof newValue === 'function' ? newValue(state.hooks[index]) : newValue;
    if (state.hooks[index] !== nextVal) {
      state.hooks[index] = nextVal;
      if (activeSimulator) {
        activeSimulator.needsRerender = true;
      }
    }
  };
  return [value, setValue];
};

mockReact.useEffect = (effect: any, deps: any[]) => {
  const state = currentComponentState;
  const index = state.hookIndex++;
  
  let changed = true;
  if (state.hooks.length > index) {
    const prevDeps = state.hooks[index].deps;
    if (prevDeps && deps && prevDeps.length === deps.length) {
      changed = prevDeps.some((d: any, i: number) => d !== deps[i]);
    }
  }
  
  if (state.hooks.length <= index) {
    state.hooks.push({ deps, cleanup: null });
  } else {
    state.hooks[index].deps = deps;
  }
  
  if (changed && activeSimulator) {
    activeSimulator.pendingEffects.push({
      state,
      index,
      effect,
    });
  }
};

mockReact.useRef = (initialValue: any) => {
  const state = currentComponentState;
  const index = state.hookIndex++;
  if (state.hooks.length <= index) {
    state.hooks.push({ current: initialValue });
  }
  return state.hooks[index];
};

mockReact.useMemo = (cb: any, deps: any[]) => {
  const state = currentComponentState;
  const index = state.hookIndex++;
  let changed = true;
  if (state.hooks.length > index) {
    const prev = state.hooks[index];
    if (prev.deps && deps && prev.deps.length === deps.length) {
      changed = prev.deps.some((d: any, i: number) => d !== deps[i]);
    }
    if (!changed) {
      return prev.value;
    }
  }
  const value = cb();
  if (state.hooks.length <= index) {
    state.hooks.push({ deps, value });
  } else {
    state.hooks[index] = { deps, value };
  }
  return value;
};

mockReact.useCallback = (cb: any, deps: any[]) => {
  return mockReact.useMemo(() => cb, deps);
};

mockReact.useId = () => {
  const state = currentComponentState;
  const index = state.hookIndex++;
  if (state.hooks.length <= index) {
    if (activeSimulator) {
      activeSimulator.idCounter++;
      state.hooks.push(`id-${activeSimulator.idCounter}`);
    } else {
      state.hooks.push(`id-static`);
    }
  }
  return state.hooks[index];
};

mockReact.useContext = (context: any) => {
  if (context === mockOverlayContext) {
    return mockOverlayContext;
  }
  return context._currentValue;
};

// Now import the real components
const React = require('react');
const { RegisteredOverlaySession } = require('../../components/providers/overlay-provider');
const { FlowDialog } = require('../../components/flow-popups/flow-dialog');
const { FlowSheet } = require('../../components/flow-popups/flow-sheet');
const { FlowFloatingSheet } = require('../../components/flow-popups/flow-floating-sheet');

// A TestWrapper to control the popup state in tests
let setTestOpenGlobal: (open: boolean) => void = () => {};

function TestWrapper({ type, open: openProp = false }: { type: 'dialog' | 'sheet' | 'floating'; open?: boolean }) {
  const [open, setOpen] = React.useState(openProp);
  
  React.useEffect(() => {
    setOpen(openProp);
  }, [openProp]);

  setTestOpenGlobal = setOpen;
  
  if (type === 'dialog') {
    return (
      <FlowDialog open={open} onOpenChange={setOpen} id="test-popup-dialog">
        <div>Content</div>
      </FlowDialog>
    );
  } else if (type === 'sheet') {
    return (
      <FlowSheet open={open} onOpenChange={setOpen} id="test-popup-sheet">
        <div>Content</div>
      </FlowSheet>
    );
  } else {
    return (
      <FlowFloatingSheet open={open} onOpenChange={setOpen} id="test-popup-floating">
        <div>Content</div>
      </FlowFloatingSheet>
    );
  }
}

describe('Overlay Lifecycle', () => {

  beforeEach(() => {
    currentProvider = new MockOverlayProvider();
    exitingCallbacks.clear();
  });

  describe('1. OverlayProvider Structured Invariants', () => {
    let provider: MockOverlayProvider;

    beforeEach(() => {
      provider = new MockOverlayProvider();
    });

    it('should prevent duplicate registrations from rerenders (idempotency)', () => {
      provider.registerOverlay('dialog-1', 'account:instance-1-session-1', 'account');
      provider.registerOverlay('dialog-1', 'account:instance-1-session-1', 'account');

      assert.strictEqual(provider.totalInstancesCount, 1);
      
      provider.unregisterOverlay('dialog-1', 'account:instance-1-session-1');
      assert.strictEqual(provider.totalInstancesCount, 0);
    });

    it('should calculate active overlay and dimming state from total instance stack count', () => {
      provider.registerOverlay('dialog-1', 'account:instance-1-session-1', 'account');
      provider.registerOverlay('dialog-1', 'account:instance-1-session-2', 'account');

      assert.strictEqual(provider.totalInstancesCount, 2);
      assert.strictEqual(provider.lastIsDimmed, true);

      provider.unregisterOverlay('dialog-1', 'account:instance-1-session-1');
      assert.strictEqual(provider.totalInstancesCount, 1);
      assert.strictEqual(provider.lastIsDimmed, true);

      provider.unregisterOverlay('dialog-1', 'account:instance-1-session-2');
      assert.strictEqual(provider.totalInstancesCount, 0);
      assert.strictEqual(provider.lastIsDimmed, false);
    });

    it('should dim/undim native system bars only on edges (0 -> 1 and 1 -> 0)', () => {
      provider.registerOverlay('dialog-1', 'account:instance-1-1', 'account');
      assert.strictEqual(provider.dimmingCallsCount, 1);

      provider.registerOverlay('dialog-2', 'account:instance-2-1', 'account');
      assert.strictEqual(provider.dimmingCallsCount, 1);

      provider.unregisterOverlay('dialog-1', 'account:instance-1-1');
      assert.strictEqual(provider.undimmingCallsCount, 0);

      provider.unregisterOverlay('dialog-2', 'account:instance-2-1');
      assert.strictEqual(provider.undimmingCallsCount, 1);
    });
  });

  describe('2. Real Component React Mount Lifecycle and Exiting animations', () => {
    let simulator: ReactSimulator;

    beforeEach(() => {
      simulator = new ReactSimulator();
    });

    const popupTypes: Array<'dialog' | 'sheet' | 'floating'> = ['dialog', 'sheet', 'floating'];

    popupTypes.forEach((type) => {
      describe(`Type: Flow${type.charAt(0).toUpperCase() + type.slice(1)}`, () => {
        it('should render closed, register 0, open, register 1, close, keep during exit, then unregister on exit complete', () => {
          // 1. Render popup closed
          simulator.run(() => <TestWrapper type={type} />);
          assert.strictEqual(currentProvider.totalInstancesCount, 0);
          assert.strictEqual(currentProvider.lastIsDimmed, false);

          // 2. Open popup
          setTestOpenGlobal(true);
          simulator.run(() => <TestWrapper type={type} />);
          assert.strictEqual(currentProvider.totalInstancesCount, 1);
          assert.strictEqual(currentProvider.lastIsDimmed, true);

          // Get the registered sessionId
          const instances = Array.from(currentProvider.activeOverlayInstances.values())[0];
          assert.ok(instances && instances.size === 1);
          const sessionId = Array.from(instances)[0].instanceId;
          assert.ok(sessionId);

          // 3. Close popup
          setTestOpenGlobal(false);
          simulator.run(() => <TestWrapper type={type} />);
          
          // Assert that the session remains registered during the exit animation
          assert.strictEqual(currentProvider.totalInstancesCount, 1);

          // 4. Complete/advance exit animation
          const exitCb = exitingCallbacks.get(sessionId);
          assert.ok(exitCb, 'Exit callback should exist for the session');
          exitCb();
          simulator.run(() => <TestWrapper type={type} />);

          // Assert zero sessions and no blocking scrim
          assert.strictEqual(currentProvider.totalInstancesCount, 0);
          assert.strictEqual(currentProvider.lastIsDimmed, false);
        });

        it('should repeat the correct behavior under StrictMode simulation (mount, unmount, remount)', () => {
          // 1. Initial Render Open
          simulator.run(() => <TestWrapper type={type} />);
          setTestOpenGlobal(true);
          simulator.run(() => <TestWrapper type={type} />);
          assert.strictEqual(currentProvider.totalInstancesCount, 1);

          // Get the registered sessionId
          const instances = Array.from(currentProvider.activeOverlayInstances.values())[0];
          const sessionId = Array.from(instances)[0].instanceId;

          // 2. Simulate StrictMode remount (unmount and remount open)
          simulator.run(() => null as any); // unmount
          assert.strictEqual(currentProvider.totalInstancesCount, 0); // Cleanup runs

          simulator.run(() => <TestWrapper type={type} open={true} />); // remount
          assert.strictEqual(currentProvider.totalInstancesCount, 1);
        });

        it('should handle rapid reopen during exit animation (register new session, keep both, exit old keeps new)', () => {
          // 1. Open first session
          simulator.run(() => <TestWrapper type={type} />);
          setTestOpenGlobal(true);
          simulator.run(() => <TestWrapper type={type} />);
          
          const instances = Array.from(currentProvider.activeOverlayInstances.values())[0];
          const sessionId1 = Array.from(instances)[0].instanceId;
          assert.strictEqual(currentProvider.totalInstancesCount, 1);

          // 2. Close first session (exit animation starts)
          setTestOpenGlobal(false);
          simulator.run(() => <TestWrapper type={type} />);
          assert.strictEqual(currentProvider.totalInstancesCount, 1); // session 1 still there

          // 3. Rapid reopen before session 1 exit animation completes
          setTestOpenGlobal(true);
          simulator.run(() => <TestWrapper type={type} />);
          
          // Verify that BOTH sessions are now registered!
          assert.strictEqual(currentProvider.totalInstancesCount, 2);

          const instancesAfterReopen = Array.from(currentProvider.activeOverlayInstances.values())[0];
          const sessionIds = Array.from(instancesAfterReopen).map(i => i.instanceId);
          assert.ok(sessionIds.includes(sessionId1));
          const sessionId2 = sessionIds.find(id => id !== sessionId1);
          assert.ok(sessionId2);

          // 4. Advance exit of first session
          const exitCb1 = exitingCallbacks.get(sessionId1);
          assert.ok(exitCb1);
          exitCb1();
          simulator.run(() => <TestWrapper type={type} />);

          // Verify session 1 is gone, but session 2 remains registered
          assert.strictEqual(currentProvider.totalInstancesCount, 1);
          const instancesFinal = Array.from(currentProvider.activeOverlayInstances.values())[0];
          assert.strictEqual(Array.from(instancesFinal)[0].instanceId, sessionId2);
        });
      });
    });
  });
});
