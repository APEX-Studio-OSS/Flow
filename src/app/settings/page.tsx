'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/components/providers/app-provider';
import { Capacitor } from '@capacitor/core';
import { CurrencySettings } from '@/features/settings/currency-settings';
import { ColorSettings } from '@/features/settings/color-settings';
import { GraphStyleSettings } from '@/features/settings/graph-style-settings';
import { AboutCard } from '@/features/settings/about-card';
import usePersistentState from '@/hooks/use-persistent-state';
import { Progress } from '@/components/ui/progress';
import { OverlayStack } from '@/lib/overlay-stack';
import { 
  ChevronRight,
  Database,
  Loader2,
  Sparkles,
  StickyNote,
  PenTool,
  Calendar,
  User
} from 'lucide-react';

export default function SettingsPage() {
  const shouldReduceMotion = useReducedMotion();
  const yVal = shouldReduceMotion ? 0 : 20;

  const { } = useApp();

  const router = useRouter();

  const [activeAnimation, setActiveAnimation] = useState<'overview' | 'note'>('overview');
  const [openMenu, setOpenMenu] = useState<'currency' | 'graph' | 'color' | null>(null);

  // OverlayStack registration for back button support
  useEffect(() => {
    if (openMenu) {
      OverlayStack.register('settings-preferences-menu', () => {
        setOpenMenu(null);
      }, 10, '/settings', false);
    } else {
      OverlayStack.unregister('settings-preferences-menu');
    }
    return () => {
      OverlayStack.unregister('settings-preferences-menu');
    };
  }, [openMenu]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAnimation(prev => (prev === 'overview' ? 'note' : 'overview'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8 pb-[calc(2.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <div className="space-y-8">
        <header className="text-left max-w-xl mx-auto lg:max-w-none">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground select-none">Settings</h1>
          <p className="mt-1.5 text-sm text-muted-foreground select-none">Customize preferences and view about information.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start max-w-xl mx-auto lg:max-w-none">
          {/* Column 1: Preferences */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card id="preferences-card" className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 select-none">
                  <CardTitle className="text-lg font-bold">Preferences</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Customize the look and feel of your app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 p-2">
                  <CurrencySettings isOpen={openMenu === 'currency'} onOpenChange={(open) => setOpenMenu(open ? 'currency' : null)} />
                  <Separator className="my-1 opacity-50" />
                  <GraphStyleSettings isOpen={openMenu === 'graph'} onOpenChange={(open) => setOpenMenu(open ? 'graph' : null)} />
                  <Separator className="my-1 opacity-50" />
                  <ColorSettings isOpen={openMenu === 'color'} onOpenChange={(open) => setOpenMenu(open ? 'color' : null)} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Column 2: Upcoming Features */}
          <div className="space-y-6">
            {/* Upcoming Features Teaser */}
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden relative select-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <CardTitle className="text-lg font-bold">Upcoming Features</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">Early look at what is coming in the next release.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-5">
                  {/* Notes Animation Canvas */}
                  <div className="relative h-36 w-full rounded-2xl bg-muted/30 border border-border/40 overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {activeAnimation === 'overview' ? (
                        <motion.div
                          key="animation-overview"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {/* Animated Notebook Outline */}
                          <motion.div 
                            className="absolute h-24 w-18 border-2 border-primary/40 bg-background/50 rounded-xl shadow-inner flex flex-col p-2 space-y-1"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          >
                            <div className="h-1 w-full bg-primary/20 rounded-full" />
                            <div className="h-1 w-4/5 bg-primary/25 rounded-full" />
                            <div className="h-1 w-full bg-primary/20 rounded-full" />
                            <div className="h-1 w-2/3 bg-primary/25 rounded-full" />
                          </motion.div>

                          {/* Animated Pen Drawing Stroke */}
                          <motion.div 
                            className="absolute z-20 text-primary"
                            animate={shouldReduceMotion ? {} : {
                              x: [-25, 25, -20, 20, -25],
                              y: [-20, -10, 10, 20, -20],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 6,
                              ease: "easeInOut"
                            }}
                          >
                            <PenTool className="h-5 w-5" />
                          </motion.div>

                          {/* Floating Chip: Category */}
                          <motion.div 
                            className="absolute left-6 top-6 bg-primary/15 border border-primary/20 text-[9px] font-bold text-primary px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                            animate={shouldReduceMotion ? {} : {
                              y: [0, -6, 0],
                              x: [0, 2, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          >
                            <StickyNote className="h-2 w-2" />
                            <span>Note</span>
                          </motion.div>

                          {/* Floating Chip: Person */}
                          <motion.div 
                            className="absolute right-6 top-8 bg-sky-500/15 border border-sky-500/20 text-[9px] font-bold text-sky-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                            animate={shouldReduceMotion ? {} : {
                              y: [0, 8, 0],
                              x: [0, -3, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                          >
                            <User className="h-2 w-2" />
                            <span>Person</span>
                          </motion.div>

                          {/* Floating Chip: Event */}
                          <motion.div 
                            className="absolute left-10 bottom-4 bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                            animate={shouldReduceMotion ? {} : {
                              y: [0, -8, 0],
                              x: [0, -4, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.2 }}
                          >
                            <Calendar className="h-2 w-2" />
                            <span>Event</span>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="animation-note"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {/* Animated Note Card */}
                          <motion.div 
                            className="relative h-24 w-36 border-2 border-primary/30 bg-background/80 rounded-xl shadow-md flex flex-col p-2.5 space-y-1.5 select-none"
                            animate={{ scale: [1, 1.01, 1], rotate: [-1, 1, -1] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                          >
                            {/* Tiny Pushpin decoration */}
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm border border-red-600 flex items-center justify-center">
                              <div className="w-1 h-1 bg-white/60 rounded-full" />
                            </div>

                            {/* Sequential writing lines */}
                            <motion.div 
                              className="h-1.5 bg-primary/20 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "90%" }}
                              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                            />
                            <motion.div 
                              className="h-1.5 bg-primary/25 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "70%" }}
                              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
                            />
                            <motion.div 
                              className="h-1.5 bg-primary/20 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "80%" }}
                              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
                            />
                            
                            {/* Animated pencil stroke inside the card */}
                            <motion.div 
                              className="absolute right-2 bottom-2 text-primary/70"
                              animate={shouldReduceMotion ? {} : {
                                x: [-20, 0, -20],
                                y: [-10, 5, -10],
                                rotate: [0, 20, 0]
                              }}
                              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                              <PenTool className="h-4 w-4" />
                            </motion.div>
                          </motion.div>

                          {/* Floating Note Badge */}
                          <motion.div 
                            className="absolute right-6 top-4 bg-amber-500/15 border border-amber-500/20 text-[9px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                            animate={shouldReduceMotion ? {} : {
                              y: [0, -5, 0],
                              x: [0, 1, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          >
                            <StickyNote className="h-2 w-2" />
                            <span>Quick Link</span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1.5 text-center px-2">
                    <h4 className="font-bold text-sm text-foreground">Interactive Notes feature</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Write memos, link transactions with events/people, and keep all notes secured local-first on your device. Coming in the next update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>

        {/* Rebuilt Premium About Card at the bottom */}
        <div className="max-w-xl mx-auto lg:max-w-none pt-4">
          <AboutCard />
        </div>
      </div>
    </div>
  );
}
