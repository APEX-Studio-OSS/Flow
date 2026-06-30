'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeNavigationProps {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextIcon?: React.ReactNode;
  backIcon?: React.ReactNode;
  isNextDisabled?: boolean;
  isFirstLaunch?: boolean;
  currentStep?: string;
  introReady?: boolean;
}

export function WelcomeNavigation({
  onNext,
  onBack,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextIcon = <ArrowRight className="h-4 w-4 text-primary-foreground" />,
  backIcon = <ArrowLeft className="h-4 w-4" />,
  isNextDisabled = false,
  isFirstLaunch = true,
  currentStep = 'welcome',
  introReady = false,
}: WelcomeNavigationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [lastClicked, setLastClicked] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWelcome = currentStep === 'welcome';

  const [isButtonInteractive, setIsButtonInteractive] = useState(false);
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);

  useEffect(() => {
    if (!isWelcome) {
      setIsEntranceComplete(false);
      setIsButtonInteractive(true);
      return;
    }
    if (introReady) {
      const timer = setTimeout(() => {
        setIsButtonInteractive(true);
        setIsEntranceComplete(true);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      setIsButtonInteractive(false);
      setIsEntranceComplete(false);
    }
  }, [introReady, isWelcome]);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const handleNextClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClicked < 800) {
      return;
    }
    setLastClicked(now);
    onNext();
  };

  const buttonVariants = {
    initial: {},
    tap: {},
  };

  const arrowVariants = {
    initial: { x: 0 },
    tap: { x: 2 },
  };

  const arrowEntranceVariants = {
    hidden: {
      x: shouldReduceMotion ? 0 : -4,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
    },
  };

  const arrowEntranceTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : {
        duration: 0.3,
        delay: isWelcome ? 0.3 : 0,
        ease: 'easeOut',
      };

  const isPending = nextLabel.includes('...') || nextLabel.toLowerCase().includes('completing') || nextLabel.toLowerCase().includes('preparing');

  const layoutTransition = shouldReduceMotion
    ? { type: 'tween', duration: 0.15 }
    : { type: 'spring', duration: 0.4, bounce: 0 };

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const containerTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : {
        duration: 0.4,
        delay: isWelcome ? 0.3 : 0.05,
        ease: 'easeOut',
      };

  return createPortal(
    <div className={cn(
      "fixed bottom-0 inset-x-0 z-40 pt-6 pb-[calc(1.5rem+var(--safe-area-bottom))] px-4 pointer-events-none transition-all duration-300",
      isWelcome ? "bg-transparent" : "bg-background border-t border-border/40"
    )}>
      <div className="w-full max-w-[430px] mx-auto pointer-events-auto">
        <LayoutGroup id="onboarding-footer">
          <motion.div
            layout
            layoutDependency={currentStep}
            variants={containerVariants}
            initial={isWelcome ? "hidden" : "visible"}
            animate={isWelcome ? (introReady ? "visible" : "hidden") : "visible"}
            transition={{
              default: containerTransition,
              layout: layoutTransition,
            }}
            className="w-full flex items-center relative"
          >
            <AnimatePresence initial={false}>
              {onBack && (
                <motion.div
                  key="back-slot"
                  layout
                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                  animate={{ opacity: 1, width: 96, marginRight: 16 }}
                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                  transition={layoutTransition}
                  style={{ overflow: 'hidden' }}
                  className="flex-shrink-0"
                >
                  <motion.button
                    layout="position"
                    type="button"
                    onClick={onBack}
                    whileTap={shouldReduceMotion ? {} : { opacity: 0.95 }}
                    className="w-24 h-[52px] rounded-full border border-border/50 bg-background/50 backdrop-blur-md text-muted-foreground hover:text-foreground active:bg-muted/60 flex items-center justify-center gap-2 select-none text-sm font-semibold shadow-sm transition-colors duration-[140ms] active:duration-[90ms] ease-out"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Go back to the previous step"
                  >
                    {backIcon}
                    <span>{backLabel}</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              layoutDependency={currentStep}
              type="button"
              onClick={handleNextClick}
              disabled={isNextDisabled || (isWelcome && !isButtonInteractive)}
              variants={shouldReduceMotion ? undefined : buttonVariants}
              initial="initial"
              whileTap={shouldReduceMotion ? {} : 'tap'}
              transition={layoutTransition}
              className={cn(
                "h-[52px] px-4 sm:px-6 rounded-full flex items-center justify-center gap-2.5 select-none text-sm font-bold tracking-wide transition-colors duration-[140ms] active:duration-[90ms] ease-out",
                "bg-primary text-primary-foreground hover:bg-primary/95 active:bg-primary/80",
                isWelcome
                  ? "shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  : "shadow-[0_2px_8px_rgba(var(--primary-rgb),0.06)]",
                onBack ? "flex-1 min-w-0" : "w-full",
                isNextDisabled ? "opacity-50 cursor-not-allowed" : "",
                (isWelcome && !isButtonInteractive) ? "pointer-events-none" : ""
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={nextLabel}
            >
              {isPending && (
                <motion.span
                  layout="position"
                  className="flex-shrink-0 mr-1 flex items-center justify-center"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.span>
              )}

              <motion.span
                layout="position"
                className="flex items-center justify-center"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={nextLabel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0.05 : 0.12 }}
                    className="whitespace-nowrap inline-block font-sans"
                  >
                    {nextLabel}
                  </motion.span>
                </AnimatePresence>
              </motion.span>

              {!isNextDisabled && !isPending && (
                <motion.span
                  layout="position"
                  variants={isWelcome ? arrowEntranceVariants : (shouldReduceMotion ? undefined : arrowVariants)}
                  initial={isWelcome ? "hidden" : undefined}
                  animate={isWelcome ? (introReady ? "visible" : "hidden") : undefined}
                  transition={isWelcome ? arrowEntranceTransition : { duration: 0.12, ease: 'easeOut' }}
                  className={cn(
                    "flex items-center justify-center flex-shrink-0 text-current",
                    (isWelcome && introReady && isEntranceComplete && !shouldReduceMotion) && "animate-welcome-arrow-nudge"
                  )}
                >
                  <ArrowRight className="h-4 w-4 text-primary-foreground transition-colors duration-300" />
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>,
    document.body
  );
}

