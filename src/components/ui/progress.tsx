"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion, useReducedMotion } from "framer-motion"
import { useApp } from "@/components/providers/app-provider"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { 
    indicatorStyle?: React.CSSProperties 
  }
>(({ className, value, indicatorStyle, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion() ?? false;
  
  let isMotionReady = true;
  try {
    const app = useApp();
    isMotionReady = app.isMotionReady;
  } catch (e) {
    // context not available
  }
  
  // Clamp visual percentage safely between 0 and 100
  const rawValue = value || 0;
  const safePercentage = Math.min(Math.max(rawValue, 0), 100);
  const targetScale = isMotionReady ? safePercentage / 100 : 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      value={safePercentage}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <motion.div
          className="h-full w-full flex-1 bg-primary"
          style={{
            transformOrigin: "left",
            originX: 0,
            ...indicatorStyle,
          }}
          initial={!shouldReduceMotion ? { scaleX: 0 } : { scaleX: targetScale }}
          animate={{ scaleX: targetScale }}
          transition={
            !shouldReduceMotion
              ? { duration: 0.55, ease: "easeOut" }
              : { duration: 0 }
          }
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

