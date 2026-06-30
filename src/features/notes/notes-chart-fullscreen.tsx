'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Note } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { X, BarChart2, TrendingUp, PieChart } from 'lucide-react';
import { NotesChart } from './notes-chart';
import { useApp } from '@/components/providers/app-provider';
import type { GraphStyle } from '@/components/providers/app-provider';

interface NotesChartFullscreenProps {
  notes: Note[];
  onClose: () => void;
}

export function NotesChartFullscreen({ notes, onClose }: NotesChartFullscreenProps) {
  const { graphStyle, setGraphStyle, graphXAxis } = useApp();
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isSubscribed = true;

    // Lock screen orientation to landscape
    import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => {
      if (isSubscribed) {
        ScreenOrientation.lock({ orientation: 'landscape' }).catch(err => {
          console.warn('Capacitor screen-orientation lock failed:', err);
        });
      }
    }).catch(() => {
      // Fallback: browser screen.orientation
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (e) {}
    });

    // Request HTML5 fullscreen mode
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } catch (e) {}

    // Cleanup: unlock orientation and exit fullscreen on unmount
    return () => {
      isSubscribed = false;

      import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => {
        ScreenOrientation.unlock().catch(() => {});
      }).catch(() => {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {}
      });

      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch (e) {}
    };
  }, []);

  // Listen to browser-native fullscreen exit (e.g. back gesture or escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      if (!isCurrentlyFullscreen) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  // Track orientation change and resize events with settling logic
  useEffect(() => {
    let timeoutId: any;
    const updateDimensions = (retries = 0) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
          });
        } else if (retries < 10) {
          timeoutId = setTimeout(() => {
            updateDimensions(retries + 1);
          }, 50);
        } else {
          setDimensions(null);
        }
      } else {
        setDimensions(null);
      }
    };

    const handleEvent = () => {
      setDimensions(null);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateDimensions();
      }, 150);
    };

    updateDimensions();

    window.addEventListener('resize', handleEvent);
    window.addEventListener('orientationchange', handleEvent);
    document.addEventListener('fullscreenchange', handleEvent);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleEvent);
      window.removeEventListener('orientationchange', handleEvent);
      document.removeEventListener('fullscreenchange', handleEvent);
    };
  }, []);

  const styleOptions = [
    { value: 'bar', icon: BarChart2, label: 'Bar' },
    { value: 'line', icon: TrendingUp, label: 'Line' },
    { value: 'donut', icon: PieChart, label: 'Donut' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col p-4 select-none overflow-hidden w-screen h-screen">
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-foreground tracking-tight">Notes Analysis</h2>
        </div>

        {/* Compact controls inside landscape fullscreen bar */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl">
          {styleOptions.map((style) => {
            const Icon = style.icon;
            const isSelected = graphStyle === style.value;

            return (
              <Button
                key={style.value}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                onClick={() => setGraphStyle(style.value as GraphStyle)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{style.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Close Button */}
        <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 rounded-full border-border/60">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Chart container taking all remaining landscape viewport */}
      <div ref={containerRef} className="flex-1 w-full relative min-h-0 flex items-center justify-center overflow-hidden">
        {!dimensions ? (
          <div className="text-muted-foreground text-sm font-semibold animate-pulse">
            Preparing chart...
          </div>
        ) : (
          <div 
            style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }} 
            className="relative overflow-hidden"
            key={`${dimensions.width}x${dimensions.height}-${graphStyle}-${graphXAxis}`}
          >
            <NotesChart notes={notes} isFullscreen={true} />
          </div>
        )}
      </div>
    </div>
  );
}
