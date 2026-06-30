'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowIntroProps {
  setNextDisabled?: (disabled: boolean) => void;
  setOnNext?: (handler: (() => void) | null) => void;
  setNextLabel?: (label: string) => void;
  introReady?: boolean;
}

export function FlowIntro({
  setNextDisabled,
  setOnNext,
  setNextLabel,
  introReady = false,
}: FlowIntroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);

  useEffect(() => {
    if (setNextLabel) setNextLabel('Get started');
    if (setNextDisabled) setNextDisabled(false);
    if (setOnNext) setOnNext(null);
  }, [setNextLabel, setNextDisabled, setOnNext]);

  useEffect(() => {
    if (introReady) {
      const timer = setTimeout(() => {
        setIsEntranceComplete(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [introReady]);

  const welcomeVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0 },
  };

  const flowVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0 },
  };

  const dashVariants = {
    hidden: { opacity: 0, scaleX: 0.78 },
    visible: {
      opacity: shouldReduceMotion ? 0.68 : 0.45,
      scaleX: shouldReduceMotion ? 1.0 : 0.78,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.35,
        delay: shouldReduceMotion ? 0 : 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-[280px] mx-auto select-none -translate-y-[10%] font-sans text-center">
      <h1 className="select-none flex flex-col items-center">
        {/* "Welcome to" with restrained medium size and weight */}
        <motion.span
          variants={welcomeVariants}
          initial="hidden"
          animate={introReady ? "visible" : "hidden"}
          transition={
            shouldReduceMotion
              ? { duration: 0.15 }
              : { duration: 0.3, ease: 'easeOut' }
          }
          className="text-lg sm:text-xl font-medium text-muted-foreground leading-none mb-3"
        >
          Welcome to
        </motion.span>

        {/* "Flow" as dominant brand word with smooth vertical mask reveal */}
        <span className="block overflow-hidden py-1">
          <motion.span
            variants={flowVariants}
            initial="hidden"
            animate={introReady ? "visible" : "hidden"}
            transition={
              shouldReduceMotion
                ? { duration: 0.15 }
                : { duration: 0.35, delay: 0.15, ease: 'easeOut' }
            }
            className="block text-6xl sm:text-7xl font-black tracking-tight text-primary leading-none"
          >
            Flow
          </motion.span>
        </span>
      </h1>

      {/* Breathing solid-blue rounded brand dash */}
      <motion.div
        variants={dashVariants}
        initial="hidden"
        animate={introReady ? "visible" : "hidden"}
        className={cn(
          "w-[36px] h-[3px] bg-primary rounded-full mt-4 flex-shrink-0",
          (introReady && isEntranceComplete && !shouldReduceMotion) && "animate-welcome-dash-breath"
        )}
        style={{ transformOrigin: 'center' }}
      />
    </div>
  );
}

