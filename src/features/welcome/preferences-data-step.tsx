'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Check, Upload, Loader2, Trash2, Banknote, Palette, ChevronDown } from 'lucide-react';
import { useApp, colorThemes } from '@/components/providers/app-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { cn, getCurrencySymbol } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { nativeBridge } from '@/lib/native-bridge';
import { parseAndValidateBackup } from '@/lib/import-export';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { TouchSafePreferenceDropdown } from '@/components/ui/touch-safe-preference-dropdown';
import { Separator } from '@/components/ui/separator';
import { OverlayStack } from '@/lib/overlay-stack';
import { Input } from '@/components/ui/input';

interface PreferencesDataStepProps {
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

const availableCurrencies = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'TRY', name: 'Turkish Lira' },
];

function truncateFilename(filename: string, maxLength: number = 20): string {
  if (!filename) return '';
  if (filename.length <= maxLength) return filename;
  const parts = filename.split('.');
  if (parts.length <= 1) return filename.substring(0, maxLength - 3) + '...';
  const ext = parts.pop();
  const base = parts.join('.');
  const baseMaxLength = maxLength - (ext ? ext.length + 4 : 3);
  if (baseMaxLength <= 0) return filename.substring(0, maxLength - 3) + '...';
  return base.substring(0, baseMaxLength) + '...' + (ext ? '.' + ext : '');
}

export function PreferencesDataStep({
  setNextDisabled,
  setOnNext,
  setNextLabel,
  setupMode,
  setSetupMode,
  importedBackupData,
  setImportedBackupData,
  backupFileName,
  setBackupFileName,
}: PreferencesDataStepProps) {
  const { userProfile, currency, setCurrency, colorThemeName, setColorThemeName, finishOnboarding } = useApp();
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const [isClient, setIsClient] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [openSection, setOpenSection] = useState<'currency' | 'appearance' | null>(null);

  const [search, setSearch] = useState('');
  const [backupError, setBackupError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const jsonImportInputRef = useRef<HTMLInputElement>(null);

  // Set mounted client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  const mode = isClient ? (resolvedTheme as 'light' | 'dark') : 'light';
  const selectedTheme = colorThemes.find((t) => t.name === colorThemeName) || colorThemes[0];



  // Register with OverlayStack so Android hardware back closes the dropdown first
  useEffect(() => {
    if (openSection) {
      OverlayStack.register(
        'onboarding-preferences-dropdown',
        () => {
          setOpenSection(null);
        },
        10,
        '/welcome',
        false
      );
    } else {
      OverlayStack.unregister('onboarding-preferences-dropdown');
    }
    return () => {
      OverlayStack.unregister('onboarding-preferences-dropdown');
    };
  }, [openSection]);

  // Reset search when currency dropdown collapses
  useEffect(() => {
    if (openSection !== 'currency') {
      setSearch('');
    }
  }, [openSection]);

  const selectCurrency = useCallback((code: string) => {
    setCurrency(code);
    setOpenSection(null);
  }, [setCurrency]);

  const selectTheme = useCallback((name: string) => {
    setColorThemeName(name);
    setOpenSection(null);
  }, [setColorThemeName]);

  // Unified backup import handlers
  const handleNativeImport = useCallback(async () => {
    try {
      setIsImporting(true);
      setBackupError(null);
      const pickerResult = await nativeBridge.importBackup();
      if (pickerResult.cancelled || !pickerResult.content) {
        setIsImporting(false);
        return;
      }

      const migratedBackup = parseAndValidateBackup(pickerResult.content);
      setImportedBackupData(migratedBackup);
      setBackupFileName(pickerResult.fileName ?? 'backup.json');
      setSetupMode('import');
      setBackupError(null);
    } catch (error: any) {
      setBackupError(error.message || 'Could not parse or validate the backup.');
    } finally {
      setIsImporting(false);
    }
  }, [setImportedBackupData, setBackupFileName, setSetupMode]);

  const handleImportJsonFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setBackupError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const migratedBackup = parseAndValidateBackup(text);
        setImportedBackupData(migratedBackup);
        setBackupFileName(file.name);
        setSetupMode('import');
        setBackupError(null);
      } catch (error: any) {
        setBackupError(error.message || 'Could not parse the JSON file.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      setBackupError('Could not read file.');
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [setImportedBackupData, setBackupFileName, setSetupMode]);

  const handleRemoveBackup = useCallback(() => {
    setSetupMode('fresh');
    setImportedBackupData(null);
    setBackupFileName('');
    setBackupError(null);
  }, [setSetupMode, setImportedBackupData, setBackupFileName]);

  const handleFinish = useCallback(async () => {
    if (isCompleting || isImporting) return;
    setIsCompleting(true);
    setSetupError(null);

    try {
      // 1. Verify access profiles and preferences exist
      const hasBackup = setupMode === 'import' && !!importedBackupData;
      const finalProfile = hasBackup && importedBackupData.data?.userProfile
        ? importedBackupData.data.userProfile
        : userProfile;

      if (!finalProfile || !finalProfile.name || finalProfile.name.trim().length === 0) {
        throw new Error('Display name is required. Please go back to the profile step.');
      }
      
      const finalCurrency = hasBackup && importedBackupData.data?.currency
        ? importedBackupData.data.currency
        : currency;

      if (!finalCurrency) {
        throw new Error('Currency is required.');
      }

      const finalTheme = hasBackup && importedBackupData.data?.colorThemeName
        ? importedBackupData.data.colorThemeName
        : colorThemeName;

      if (!finalTheme) {
        throw new Error('Color theme is required.');
      }

      // 2. Perform atomic completion
      let dataToOnboard: { sampleData: boolean; importData?: any } = { sampleData: false };
      if (hasBackup) {
        const mergedImportData = {
          ...importedBackupData,
          data: {
            ...importedBackupData.data,
            userProfile: finalProfile,
            currency: finalCurrency,
            colorThemeName: finalTheme,
            expenseRemindersEnabled: importedBackupData.data.expenseRemindersEnabled ?? false,
          }
        };
        dataToOnboard = { sampleData: false, importData: mergedImportData };
      } else {
        dataToOnboard = { sampleData: false };
      }

      await finishOnboarding(dataToOnboard);

      // Reset temporary states
      setImportedBackupData(null);
      setBackupFileName('');
      setBackupError(null);
    } catch (err: any) {
      setIsCompleting(false);
      setSetupError(err.message || 'An error occurred during setup completion.');
    }
  }, [isCompleting, isImporting, userProfile, currency, colorThemeName, setupMode, importedBackupData, finishOnboarding, setImportedBackupData, setBackupFileName]);

  // Bind callback parameters to page-level footer controllers
  useEffect(() => {
    if (setNextLabel) {
      setNextLabel(isCompleting ? 'Completing...' : 'Complete setup');
    }
    const isNextBtnDisabled = isImporting || isCompleting || (setupMode === 'import' && !importedBackupData);
    if (setNextDisabled) {
      setNextDisabled(isNextBtnDisabled);
    }
    if (setOnNext) {
      setOnNext(handleFinish);
    }
    return () => {
      if (setOnNext) setOnNext(null);
    };
  }, [setNextLabel, setNextDisabled, setOnNext, isImporting, isCompleting, setupMode, importedBackupData, handleFinish]);

  // Memoized currency options
  const filteredCurrencies = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return availableCurrencies;
    return availableCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    );
  }, [search]);

  const hasBackup = setupMode === 'import' && !!importedBackupData;

  return (
    <div className="w-full max-w-sm mx-auto px-4 select-none font-sans overflow-y-auto no-scrollbar max-h-full py-4 pb-32 flex flex-col">
      {/* 1. Header Title & Subtitle */}
      <div className="text-center mb-6 flex-shrink-0">
        <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-2 leading-none">
          Finish setup
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Choose your preferences and optionally restore a backup.
        </p>
      </div>

      {/* 2. Preferences and Backup Area */}
      <div className="space-y-6">
        {/* PREFERENCES SECTION */}
        <motion.div layout="position" transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="space-y-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-0 mb-2">
            Preferences
          </h3>
          
          {/* Currency Dropdown Selector */}
          <TouchSafePreferenceDropdown
            variant="unboxed"
            title="Currency"
            description="Set your preferred currency for display."
            icon={<Banknote className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            isOpen={openSection === 'currency'}
            onOpenChange={(open) => setOpenSection(open ? 'currency' : null)}
            triggerContent={
              <span className="font-semibold text-foreground text-xs">
                {currency} · {getCurrencySymbol(currency)}
              </span>
            }
          >
            <div className="space-y-2 select-none">
              <Input
                placeholder="Search currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl text-xs bg-background/50 border-input focus:ring-2 focus:ring-primary"
              />
              <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredCurrencies.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onPointerUp={(e) => {
                        e.stopPropagation();
                        selectCurrency(c.code);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCurrency(c.code);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between h-11 px-3 text-xs rounded-xl transition-[background-color,transform,opacity] duration-150 ease-out border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-[0.985] active:opacity-95 text-left",
                        isSelected 
                          ? "bg-muted/70 font-bold text-foreground"
                          : "hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold flex-shrink-0">{c.code}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground">{getCurrencySymbol(c.code)}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
                {filteredCurrencies.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No matching currencies found.
                  </div>
                )}
              </div>
            </div>
          </TouchSafePreferenceDropdown>

          <Separator className="opacity-45 ml-[52px]" />

          {/* Appearance Dropdown Selector */}
          <TouchSafePreferenceDropdown
            variant="unboxed"
            title="Appearance"
            description="Choose a theme configuration for colors."
            icon={<Palette className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            isOpen={openSection === 'appearance'}
            onOpenChange={(open) => setOpenSection(open ? 'appearance' : null)}
            triggerContent={
              <div className="flex items-center gap-1.5 min-w-0 select-none">
                <div className="flex -space-x-1 flex-shrink-0">
                  <div
                    className="h-3 w-3 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: isClient ? `hsl(${selectedTheme.primary[mode]})` : undefined }}
                  />
                  <div
                    className="h-3 w-3 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: isClient ? `hsl(${selectedTheme.accent[mode]})` : undefined }}
                  />
                </div>
                <span className="font-semibold text-foreground text-xs truncate">{selectedTheme.name}</span>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-2 select-none">
              {colorThemes.map((theme) => {
                const isSelected = colorThemeName === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      selectTheme(theme.name);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTheme(theme.name);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between h-11 px-3 text-xs rounded-xl transition-[background-color,transform,opacity] duration-150 ease-out border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-[0.985] active:opacity-95 text-left",
                      isSelected 
                        ? "bg-muted/70 font-bold text-foreground"
                        : "hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-1 flex-shrink-0">
                        <div
                          className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
                          style={{ backgroundColor: isClient ? `hsl(${theme.primary[mode]})` : undefined }}
                        />
                        <div
                          className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
                          style={{ backgroundColor: isClient ? `hsl(${theme.accent[mode]})` : undefined }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-foreground truncate">{theme.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </TouchSafePreferenceDropdown>
        </motion.div>

        {/* IMPORT BACKUP SECTION */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Import backup
            </span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary tracking-wider select-none leading-none">
              Optional
            </span>
          </div>
          <p className="text-xs text-muted-foreground px-0 font-medium leading-relaxed">
            Restore transactions, budgets, and settings from a backup file.
          </p>

          <motion.div layout className="relative w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {isImporting ? (
                <motion.div
                  key="importing"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="w-full flex items-center p-4 border rounded-xl bg-muted/20 border-border/80 text-left"
                >
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  </div>
                  <div className="flex flex-col ml-4 flex-1 min-w-0">
                    <span className="font-semibold text-sm text-foreground leading-snug">Reading backup file...</span>
                    <span className="text-xs text-muted-foreground truncate leading-normal mt-0.5 font-medium">
                      Validating file content
                    </span>
                  </div>
                </motion.div>
              ) : hasBackup ? (
                <motion.div
                  key="selected"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="w-full flex items-center justify-between p-4 border border-emerald-500/15 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] rounded-xl text-left"
                >
                  <div className="flex items-center min-w-0 flex-1 gap-4">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 animate-none">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left flex-1 select-none">
                      <h4 className="font-medium text-foreground">Backup selected</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold leading-normal mt-0.5 animate-none">
                        Ready to restore
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={isCompleting}
                      onClick={handleRemoveBackup}
                      className="relative h-8 w-8 flex items-center justify-center rounded-[10px] bg-destructive/5 hover:bg-destructive/10 text-destructive dark:bg-destructive/10 dark:hover:bg-destructive/15 active:scale-95 transition-[background-color,transform] duration-150 focus:outline-none after:absolute after:h-12 after:w-12 after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      title="Remove backup"
                      aria-label="Remove backup"
                    >
                      <Trash2 className="h-[17px] w-[17px] stroke-[1.75]" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="w-full animate-none"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (Capacitor.isNativePlatform()) {
                        void handleNativeImport();
                      } else {
                        jsonImportInputRef.current?.click();
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 border border-dashed rounded-xl hover:bg-muted/15 focus-within:bg-muted/15 active:scale-[0.99] active:opacity-95 transition-[background-color,transform,opacity] duration-150 ease-out border-border"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center min-w-0 flex-1 animate-none gap-4">
                      <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col min-w-0 text-left flex-1">
                        <h4 className="font-medium text-foreground">Choose backup file</h4>
                        <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                          No backup selected
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/80 flex-shrink-0 ml-2 animate-none" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Backup Error */}
          <AnimatePresence>
            {backupError && (
              <motion.p
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="text-xs font-semibold text-destructive mt-1.5 pl-1 flex items-start gap-1 animate-none"
                role="alert"
              >
                <span>⚠️</span>
                <span>{backupError}</span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Setup Error */}
          <AnimatePresence>
            {setupError && (
              <motion.p
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                className="text-xs font-bold text-destructive text-center mt-2.5 px-4 leading-normal animate-none"
                role="alert"
              >
                {setupError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <input
        type="file"
        id="setup-import-json-file-input"
        ref={jsonImportInputRef}
        className="hidden"
        accept=".json"
        onChange={handleImportJsonFile}
      />
    </div>
  );
}
