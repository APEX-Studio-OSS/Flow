'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Sparkles, Upload, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { nativeBridge } from '@/lib/native-bridge';
import { parseAndValidateBackup } from '@/lib/import-export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/components/providers/app-provider';

interface DataStepProps {
  setNextDisabled?: (disabled: boolean) => void;
  setOnNext?: (handler: (() => void) | null) => void;
  setNextLabel?: (label: string) => void;
  setupMode: 'fresh' | 'import';
  setSetupMode: (mode: 'fresh' | 'import') => void;
  importedBackupData: any;
  setImportedBackupData: (data: any) => void;
  backupFileName: string;
  setBackupFileName: (name: string) => void;
}

export function DataStep({
  setNextDisabled,
  setOnNext,
  setNextLabel,
  setupMode,
  setSetupMode,
  importedBackupData,
  setImportedBackupData,
  backupFileName,
  setBackupFileName,
}: DataStepProps) {
  const { nextStep } = useApp();
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNativeImport = async () => {
    try {
      setIsImporting(true);
      setError(null);
      const pickerResult = await nativeBridge.importBackup();
      if (pickerResult.cancelled || !pickerResult.content) {
        setIsImporting(false);
        return;
      }
      
      const migratedBackup = parseAndValidateBackup(pickerResult.content);
      setImportedBackupData(migratedBackup);
      setBackupFileName(pickerResult.fileName ?? 'backup.json');
      setSetupMode('import');
    } catch (err: any) {
      setError(err.message || 'Could not read the backup file.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const migratedBackup = parseAndValidateBackup(text);
        setImportedBackupData(migratedBackup);
        setBackupFileName(file.name);
        setSetupMode('import');
      } catch (err: any) {
        setError(err.message || 'Could not parse the JSON file.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      setError('Could not read file.');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSubmit = useCallback(() => {
    nextStep();
  }, [nextStep]);

  useEffect(() => {
    const isNextBtnDisabled = isImporting || (setupMode === 'import' && !importedBackupData);
    if (setNextLabel) setNextLabel('Continue');
    if (setNextDisabled) setNextDisabled(isNextBtnDisabled);
    if (setOnNext) setOnNext(handleSubmit);
    return () => {
      if (setOnNext) setOnNext(null);
    };
  }, [setNextLabel, setNextDisabled, setOnNext, isImporting, setupMode, importedBackupData, handleSubmit]);

  const options = [
    {
      id: 'fresh',
      title: 'Start Fresh',
      description: 'Create a clean local database.',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: 'import',
      title: 'Restore Backup',
      description: 'Import an existing Flow JSON backup.',
      icon: <Upload className="h-4 w-4" />,
    },
  ];

  return (
    <Card className="border border-border/40 shadow-md bg-card/60 backdrop-blur-md rounded-3xl w-full select-none font-sans">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Set up your data</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Start fresh or restore from a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isImporting}
              onClick={() => {
                if (option.id === 'import') {
                  if (Capacitor.isNativePlatform()) {
                    void handleNativeImport();
                  } else {
                    jsonImportInputRef.current?.click();
                  }
                } else {
                  setSetupMode('fresh');
                  setImportedBackupData(null);
                  setBackupFileName('');
                }
              }}
              className={cn(
                'w-full text-left p-4 border rounded-2xl flex items-center gap-3 transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primary',
                setupMode === option.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'hover:bg-muted/30 bg-background/25 border-border/40',
                isImporting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="p-2.5 bg-muted/40 rounded-xl text-primary flex-shrink-0">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-foreground">
                  {option.title}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{option.description}</p>
                {option.id === 'import' && isImporting ? (
                  <p className="mt-2 text-[10px] text-primary flex items-center font-semibold animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Importing backup file...
                  </p>
                ) : option.id === 'import' && importedBackupData && setupMode === 'import' ? (
                  <p 
                    role="status" 
                    aria-live="polite" 
                    className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center font-semibold"
                  >
                    <Check className="h-3 w-3 mr-1 flex-shrink-0" />
                    Backup loaded
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-destructive text-center w-full bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 select-none animate-none">
            {error}
          </p>
        )}

        <input
          type="file"
          id="setup-import-json-file-input"
          ref={jsonImportInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImportJsonFile}
        />
        
        {/* Small privacy note */}
        <p className="text-[10px] text-muted-foreground text-center font-medium leading-normal flex items-center justify-center gap-1.5 pt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          Your data stays local on this device.
        </p>
      </CardContent>
    </Card>
  );
}
