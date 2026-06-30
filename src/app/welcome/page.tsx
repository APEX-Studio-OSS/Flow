'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { FlowIntro } from '@/features/welcome/flow-intro';
import { ProfileStep } from '@/features/welcome/profile-step';
import { PreferencesDataStep } from '@/features/welcome/preferences-data-step';
import { WelcomeNavigation } from '@/features/welcome/welcome-navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { applyNativeSystemBars } from '@/services/native-system-bars';

const ONBOARDING_SEQUENCE = ['welcome', 'profile', 'preferences-data'] as const;

const steps = {
  'welcome': FlowIntro,
  'profile': ProfileStep,
  'preferences-data': PreferencesDataStep,
};

const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -24 : 24,
    opacity: 0,
  }),
};

export default function WelcomePage() {
  const { currentStep, nextStep, prevStep, colorThemeName, isLoaded, accessState, isMotionReady } = useApp();
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [prevStepVal, setPrevStepVal] = useState(currentStep);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const introReady = isMotionReady;

  // Handle native system bars styling dynamically during onboarding
  useEffect(() => {
    applyNativeSystemBars(resolvedTheme, colorThemeName, { isWelcome: currentStep === 'welcome' });
    return () => {
      // Restore normal app system bar styling when leaving onboarding or component unmounts
      applyNativeSystemBars(resolvedTheme, colorThemeName, { isWelcome: false });
    };
  }, [currentStep, resolvedTheme, colorThemeName]);

  // Handle visibility tracking (minimizing/backgrounding) to pause/resume animations
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined') {
        if (document.hidden) {
          document.body.classList.add('document-hidden');
        } else {
          document.body.classList.remove('document-hidden');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    let appStateListener: any = null;
    const setupAppListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          appStateListener = await App.addListener('appStateChange', (state) => {
            if (typeof document !== 'undefined') {
              if (!state.isActive) {
                document.body.classList.add('document-hidden');
              } else {
                document.body.classList.remove('document-hidden');
              }
            }
          });
        }
      } catch (err) {
        console.warn('Failed to listen to appStateChange:', err);
      }
    };
    void setupAppListener();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (appStateListener) {
        appStateListener.remove();
      }
      if (typeof document !== 'undefined') {
        document.body.classList.remove('document-hidden');
      }
    };
  }, []);

  // Shared backup/import state model
  const [setupMode, setSetupMode] = useState<'fresh' | 'import'>('fresh');
  const [importedBackupData, setImportedBackupData] = useState<any>(null);
  const [backupFileName, setBackupFileName] = useState('');
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const revealed = sessionStorage.getItem('flow-welcome-revealed');
      if (revealed === 'true') {
        setIsFirstLaunch(false);
      }
    }
  }, []);

  // Clear temporary file metadata when Setup flow is completed or abandoned
  useEffect(() => {
    return () => {
      setImportedBackupData(null);
      setBackupFileName('');
    };
  }, []);

  // Navigation settings managed by active steps
  const [nextDisabled, setNextDisabled] = useState(false);
  const [nextLabel, setNextLabel] = useState('Continue');
  const [onNextHandler, setOnNextHandler] = useState<(() => void) | null>(null);

  // Transition locking
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstMountRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (currentStep !== prevStepVal) {
    const prevIdx = ONBOARDING_SEQUENCE.indexOf(prevStepVal);
    const currIdx = ONBOARDING_SEQUENCE.indexOf(currentStep);
    setDirection(currIdx > prevIdx ? 'forward' : 'backward');
    setPrevStepVal(currentStep);
  }

  useEffect(() => {
    isFirstMountRef.current = false;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Ensure scroll is reset to top on step transitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    // Blur active inputs to close keyboard before moving
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 380);

    try {
      if (onNextHandler) {
        onNextHandler();
      } else {
        nextStep();
      }
    } catch (err) {
      console.error("Exception in onboarding next step handler:", err);
      setIsTransitioning(false);
    }
  }, [isTransitioning, onNextHandler, nextStep]);

  const handleBack = useCallback(() => {
    if (isTransitioning) return;

    // Blur active inputs to close keyboard before moving
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 380);

    prevStep();
  }, [isTransitioning, prevStep]);

  const setNextDisabledForStep = useCallback((stepKey: string, disabled: boolean) => {
    if (stepKey === currentStep) {
      setNextDisabled(disabled);
    }
  }, [currentStep]);

  const setNextLabelForStep = useCallback((stepKey: string, label: string) => {
    if (stepKey === currentStep) {
      setNextLabel(label);
    }
  }, [currentStep]);

  const setOnNextForStep = useCallback((stepKey: string, handler: (() => void) | null) => {
    if (stepKey === currentStep) {
      if (handler !== null) {
        setOnNextHandler(() => handler);
      } else {
        setOnNextHandler(null);
      }
    }
  }, [currentStep]);

  const CurrentStepComponent = steps[currentStep];

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col justify-between px-5 pt-[calc(1.5rem+var(--safe-area-top))] pb-[calc(1.5rem+var(--safe-area-bottom))] overflow-hidden relative">

      {/* 1. Step Viewport Stage */}
      <div className="relative z-10 flex-1 w-full flex flex-col justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={shouldReduceMotion ? undefined : slideVariants}
            initial={shouldReduceMotion ? { opacity: 0 } : 'enter'}
            animate={shouldReduceMotion ? { opacity: 1 } : 'center'}
            exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
            transition={shouldReduceMotion ? { duration: 0.15 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-1 flex flex-col justify-center"
            style={{
              width: '100%',
            }}
          >
            <CurrentStepComponent
              setNextDisabled={(disabled) => setNextDisabledForStep(currentStep, disabled)}
              setOnNext={(handler) => setOnNextForStep(currentStep, handler)}
              setNextLabel={(label) => setNextLabelForStep(currentStep, label)}
              setupMode={setupMode}
              setSetupMode={setSetupMode}
              importedBackupData={importedBackupData}
              setImportedBackupData={setImportedBackupData}
              backupFileName={backupFileName}
              setBackupFileName={setBackupFileName}
              introReady={introReady}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2. Stable Bottom Navigation */}
      <div className="relative z-10 w-full py-4 flex-shrink-0">
        <WelcomeNavigation
          onNext={handleNext}
          onBack={currentStep !== 'welcome' ? handleBack : undefined}
          nextLabel={nextLabel}
          isNextDisabled={nextDisabled}
          isFirstLaunch={isFirstLaunch}
          currentStep={currentStep}
          introReady={introReady}
        />
      </div>
    </div>
  );
}
