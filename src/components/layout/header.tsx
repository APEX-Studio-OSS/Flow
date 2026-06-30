
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/icons/app-icon';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, BarChart, List, AreaChart, StickyNote } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/components/providers/app-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { FlowAvatar } from '@/components/ui/flow-avatar';
import { useAppBack } from '@/hooks/use-app-back';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const handleAppBack = useAppBack();
  const { isFirstTime, userProfile, experimentalSettings } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const { isNotesEnabled } = experimentalSettings || { isNotesEnabled: false };
  
  const isDashboard = pathname === '/dashboard';

  if (isFirstTime) {
    return null; // Don't show header during onboarding
  }

  return (
    <header className="app-header">
      <div className="flex h-16 w-full max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex items-center">
          {!isDashboard ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleAppBack()} 
              className="mr-2 h-12 w-12 rounded-full"
            >
              <ArrowLeft className="h-[30px] w-[30px]" />
              <span className="sr-only">Back</span>
            </Button>
          ) : (
            <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
              <button 
                onClick={() => router.replace('/account')} 
                className="group flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0" 
                aria-label="Open account"
              >
                <FlowAvatar
                  name={userProfile?.name || ''}
                  avatarUrl={userProfile?.avatarUrl || null}
                  isGeneratedAvatar={!!userProfile?.isGeneratedAvatar}
                  className="h-11 w-11 border-2 border-primary/20 hover:border-primary transition-colors duration-200"
                  fallbackClassName="text-base"
                />
              </button>
            </motion.div>
        )}
      </div>
      
      {isDashboard && (
        <div className="flex justify-end items-center space-x-1">
          {isNotesEnabled && (
            <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.replace('/notes')}
                className="h-12 w-12 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" 
                aria-label="Open notes"
              >
                <StickyNote className="h-[34px] w-[34px]" />
              </Button>
            </motion.div>
          )}

          <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.replace('/graph')}
              className="h-12 w-12 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" 
              aria-label="Open insights"
            >
              <BarChart className="h-[34px] w-[34px]" />
            </Button>
          </motion.div>

          <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.replace('/settings')}
              className="h-12 w-12 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" 
              aria-label="Open settings"
            >
              <Settings className="h-[34px] w-[34px]" />
            </Button>              
          </motion.div>
        </div>
      )}
      </div>
    </header>
  );
}

    
