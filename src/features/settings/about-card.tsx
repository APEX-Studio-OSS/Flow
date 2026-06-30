'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { APP_METADATA } from '@/constants/app-metadata';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AppIcon } from '@/components/icons/app-icon';
import { ROUTES } from '@/constants/routes';

export function AboutCard() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const yVal = shouldReduceMotion ? 0 : 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: yVal }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full select-none"
    >
      <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 select-none">
          <CardTitle className="text-lg font-bold text-foreground">About</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
            Product identity and open-source details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-2">
          {/* Clickable Identity Section */}
          <Link
            href={ROUTES.about}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition-colors select-none group w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* App Icon with Pulse */}
              <div className="relative flex-shrink-0">
                {!shouldReduceMotion && (
                  <motion.div
                    animate={{
                      scale: [0.98, 1.08, 0.98],
                      opacity: [0.15, 0.35, 0.15],
                    }}
                    transition={{
                      duration: 3.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                    className="absolute -inset-2 rounded-2xl bg-primary/15 -z-10"
                  />
                )}
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary/12 to-primary/5 rounded-2xl text-primary ring-4 ring-primary/5 shadow-sm border border-primary/15 backdrop-blur-md">
                  <AppIcon className="h-9 w-9 text-primary" />
                </div>
              </div>

              {/* Text metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-foreground tracking-tight">{APP_METADATA.name}</span>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    v{APP_METADATA.version}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal truncate">
                  Personal finance manager
                </p>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </Link>

          <Separator className="opacity-50" />

          {/* Info Rows */}
          <div className="space-y-3.5 px-3 py-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-muted-foreground">Developer</span>
              <span className="font-semibold text-foreground">{APP_METADATA.developer}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-muted-foreground">Studio</span>
              <span className="font-semibold text-foreground">{APP_METADATA.studio}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-muted-foreground">License</span>
              <span className="font-semibold text-foreground text-right">Apache License, Version 2.0</span>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground/60 text-center select-none font-medium leading-relaxed mt-1 px-2">
            Copyright © 2026 APEX Studio.
            <br />
            Licensed under the Apache License, Version 2.0.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

