'use client';

import React, { useState, useRef, useEffect, useCallback, Component, ErrorInfo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlowAvatar } from '@/components/ui/flow-avatar';
import { 
  Camera, 
  Pencil,
  Download, 
  Upload, 
  Database, 
  Info, 
  Trash2, 
  ShieldCheck, 
  FileDown,
  Loader2,
  Play,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/components/providers/app-provider';
import { useOverlay } from '@/components/providers/overlay-provider';
import { getCurrentMonthKey, cn, validateLogoutName } from '@/lib/utils';
import { AvatarCropSheet } from '@/features/account/components/avatar-crop-sheet';
import { FlowDialog } from '@/components/flow-popups/flow-dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Capacitor } from '@capacitor/core';
import { nativeBridge } from '@/lib/native-bridge';
import { parseAndValidateBackup, generateBackupJSON } from '@/lib/import-export';
import { storage } from '@/lib/storage';

const profileSchema = z.object({
  name: z.string()
    .refine(val => val.trim().length > 0, { message: 'Enter a display name.' })
    .refine(val => val.trim().length <= 100, { message: 'Name must be 100 characters or less.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ResetStage =
  | 'backupRequired'
  | 'confirmName'
  | 'finalConfirm'
  | null;

type ValidatedBackup = {
  version: string;
  exportedAt: string;
  data: any;
};

type BackupSummary = {
  expensesCount: number;
  categoriesCount: number;
  budgetsCount: number;
  notesCount: number;
  version: string;
};

type PendingImport = {
  backup: ValidatedBackup;
  summary: BackupSummary;
} | null;
function ResetDialogContent({
  userProfile,
  onReset,
  onExport,
  resetStage,
  setResetStage,
  resetNameInput,
  setResetNameInput,
  resetValidationError,
  setResetValidationError,
  isVerifying,
  setIsVerifying,
  isResetting,
  setIsResetting,
  backupExportedForReset,
  setBackupExportedForReset,
  isExportingLocal,
  setIsExportingLocal,
  exportError,
  setExportError,
  cancelResetFlow,
}: {
  userProfile: { name: string };
  onReset: () => void;
  onExport: () => Promise<boolean>;
  resetStage: ResetStage;
  setResetStage: (stage: ResetStage) => void;
  resetNameInput: string;
  setResetNameInput: (val: string) => void;
  resetValidationError: string | null;
  setResetValidationError: (val: string | null) => void;
  isVerifying: boolean;
  setIsVerifying: (val: boolean) => void;
  isResetting: boolean;
  setIsResetting: (val: boolean) => void;
  backupExportedForReset: boolean;
  setBackupExportedForReset: (val: boolean) => void;
  isExportingLocal: boolean;
  setIsExportingLocal: (val: boolean) => void;
  exportError: string;
  setExportError: (val: string) => void;
  cancelResetFlow: () => void;
}) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stepContainerRef = useRef<HTMLDivElement>(null);

  const step = resetStage || 'backupRequired';

  // Shift focus to the active step wrapper after step transition (without opening soft keyboard)
  useEffect(() => {
    if (stepContainerRef.current) {
      stepContainerRef.current.focus({ preventScroll: true });
    }
  }, [step]);

  const goToStep = (nextStep: 'backupRequired' | 'confirmName' | 'finalConfirm') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setResetStage(nextStep);
  };

  const handleConfirmName = () => {
    if (isVerifying || isTransitioning) return;
    setIsVerifying(true);

    if (resetNameInput === userProfile.name) {
      goToStep('finalConfirm');
      setResetValidationError(null);
      setIsVerifying(false);
    } else {
      setResetValidationError('Name must match exactly, including uppercase and lowercase letters.');
      setIsVerifying(false);
    }
  };

  const handleExport = async () => {
    if (isExportingLocal) return;
    setIsExportingLocal(true);
    setExportError('');
    try {
      const success = await onExport();
      if (success) {
        setBackupExportedForReset(true);
      }
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || 'Export failed. Please try again.');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleResetClick = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetValidationError(null);
    try {
      await onReset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const shouldReduceMotion = useReducedMotion();

  const stepVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  const stepTransition = {
    duration: shouldReduceMotion ? 0.05 : 0.14,
    ease: 'easeInOut',
  };

  const renderStepContent = () => {
    switch (step) {
      case 'backupRequired':
        return (
          <>
            <div className="flex flex-col space-y-2 text-left">
              <h2 className="text-foreground font-bold text-lg text-left">
                Backup Required
              </h2>
              <p className="text-muted-foreground text-sm text-left leading-relaxed">
                Export a backup to prevent permanent loss of your data before resetting.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl text-xs font-semibold border-input btn-premium-touch shadow-sm flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleExport();
                }}
                disabled={isExportingLocal}
              >
                {isExportingLocal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export Backup</span>
                  </>
                )}
              </Button>

              {backupExportedForReset && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-semibold text-sm">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                  <span>Backup exported</span>
                </div>
              )}

              {exportError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium leading-relaxed text-left flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-destructive" />
                  <span>{exportError}</span>
                </div>
              )}
            </div>
            <div className="mt-5 gap-2 flex flex-col sm:flex-row">
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch mt-0"
                disabled={isExportingLocal}
                onClick={(e) => {
                  e.preventDefault();
                  cancelResetFlow();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  goToStep('confirmName');
                }}
                className="w-full rounded-xl h-11 text-xs font-semibold bg-primary hover:bg-primary/90 text-white btn-premium-touch"
                disabled={!backupExportedForReset || isExportingLocal || isTransitioning}
              >
                Continue
              </Button>
            </div>
          </>
        );
      case 'confirmName':
        return (
          <>
            <div className="flex flex-col space-y-2 text-left">
              <h2 className="text-foreground font-bold text-lg text-left">
                Confirm Display Name
              </h2>
              <p className="text-muted-foreground text-sm text-left leading-relaxed">
                Type your display name exactly as shown (case-sensitive) to proceed: <span className="font-bold text-foreground">"{userProfile.name}"</span>
              </p>
            </div>
            <div className="mt-4">
              <Input
                value={resetNameInput}
                onChange={(e) => {
                  setResetNameInput(e.target.value);
                  if (resetValidationError) setResetValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmName();
                  }
                }}
                placeholder="Type your name..."
                className="h-[52px] w-full rounded-xl text-base bg-background/50 border border-input px-4 box-sizing: border-box focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                aria-label="Confirm Display Name"
                disabled={isVerifying}
              />
              {resetValidationError && (
                <p className="text-xs font-semibold text-destructive text-left leading-normal mt-1.5">{resetValidationError}</p>
              )}
            </div>
            <div className="mt-5 gap-2 flex flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => goToStep('backupRequired')}
                className="w-full rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch"
                disabled={isVerifying || isTransitioning}
              >
                Back
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmName();
                }}
                className="w-full rounded-xl h-11 text-xs font-semibold bg-primary hover:bg-primary/90 text-white btn-premium-touch"
                disabled={isVerifying || isTransitioning}
              >
                Verify name
              </Button>
            </div>
          </>
        );
      case 'finalConfirm':
        return (
          <>
            <div className="flex flex-col space-y-2 text-left">
              <h2 className="text-foreground font-bold text-lg text-left text-destructive">
                Final Confirmation
              </h2>
              <p className="text-muted-foreground text-sm text-left leading-relaxed">
                Display name verified. Clicking below will permanently wipe all local database records from this device.
              </p>
            </div>
            <div className="mt-4">
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold leading-relaxed text-left flex items-start gap-3">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>This action cannot be undone. All transactions, categories, budgets, and settings will be permanently deleted.</span>
              </div>
            </div>
            {resetValidationError && (
              <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold leading-relaxed text-left flex items-start gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-destructive" />
                <span>{resetValidationError}</span>
              </div>
            )}
            <div className="mt-5 gap-2 flex flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => goToStep('confirmName')}
                className="w-full rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch"
                disabled={isResetting || isTransitioning}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  handleResetClick();
                }}
                className="w-full rounded-xl h-11 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white btn-premium-touch"
                disabled={isResetting || isTransitioning}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-destructive-foreground" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  "Reset app data"
                )}
              </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          ref={stepContainerRef}
          tabIndex={-1}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={stepTransition}
          onAnimationComplete={() => setIsTransitioning(false)}
          className="flex flex-col w-full outline-none focus:outline-none"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AccountPageContent() {
  const { 
    userProfile, 
    setUserProfile, 
    isLoaded,
    expenseRemindersEnabled,
    setExpenseRemindersEnabled,
    triggerTestReminder,
    resetForFreshOnboarding,
    replaceAppData
  } = useApp();

  const { unregisterOverlayOwner, activeOverlayIds, hasActiveOverlay } = useOverlay();
  const shouldReduceMotion = useReducedMotion();
  const yVal = shouldReduceMotion ? 0 : 20;

  // Data Management states
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const isImportDialogOpen = pendingImport !== null;
  const [resetStage, setResetStage] = useState<ResetStage>(null);
  const isResetFlowOpen = resetStage !== null;
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Hoisted Reset Dialog states
  const [resetNameInput, setResetNameInput] = useState('');
  const [resetValidationError, setResetValidationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backupExportedForReset, setBackupExportedForReset] = useState(false);
  const [isExportingLocal, setIsExportingLocal] = useState(false);
  const [exportError, setExportError] = useState('');

  const cancelResetFlow = useCallback(() => {
    setResetStage(null);
    setResetNameInput('');
    setResetValidationError(null);
    setBackupExportedForReset(false);
    setIsVerifying(false);
    setIsResetting(false);
    setIsExportingLocal(false);
    setExportError('');
  }, []);

  const handleResetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      cancelResetFlow();
    }
  };

  const handleResetExitComplete = useCallback(() => {
    // Only perform Reset-flow retained-data cleanup if needed
    setResetNameInput('');
    setResetValidationError(null);
    setBackupExportedForReset(false);
    setIsVerifying(false);
    setIsResetting(false);
    setIsExportingLocal(false);
    setExportError('');
  }, []);

  const cancelImport = useCallback(() => {
    setPendingImport(null);
    setImportError(null);
    setOperationError(null);
  }, []);

  const handleImportOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      cancelImport();
    }
  }, [cancelImport]);
  
  const [permissionError, setPermissionError] = useState(false);

  // Profile fields & avatar
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // 9. Cleanup all overlays owned by Account page on unmount
  useEffect(() => {
    return () => {
      unregisterOverlayOwner('account');
    };
  }, [unregisterOverlayOwner]);

  // Global exception diagnostics
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[IMPORT_DIAGNOSTIC] window.onerror caught error:', event.error || event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[IMPORT_DIAGNOSTIC] unhandledrejection caught promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Development assertion checks on close transitions
  const cropOpenedRef = useRef(false);
  if (isCropDialogOpen) cropOpenedRef.current = true;

  useEffect(() => {
    if (!isCropDialogOpen && cropOpenedRef.current) {
      const timer = setTimeout(() => {
        if (activeOverlayIds.has('sheet-account-crop')) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[OVERLAY_ASSERTION_FAILED] sheet-account-crop remains registered after close exit animation!');
            throw new Error('[OVERLAY_ASSERTION_FAILED] sheet-account-crop remains registered after close exit animation!');
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[OVERLAY_ASSERTION_PASSED] sheet-account-crop successfully unregistered after exit.');
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCropDialogOpen, activeOverlayIds]);

  const importOpenedRef = useRef(false);
  if (isImportDialogOpen) importOpenedRef.current = true;

  useEffect(() => {
    if (!isImportDialogOpen && importOpenedRef.current) {
      const timer = setTimeout(() => {
        if (activeOverlayIds.has('dialog-account-import')) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[OVERLAY_ASSERTION_FAILED] dialog-account-import remains registered after close exit animation!');
            throw new Error('[OVERLAY_ASSERTION_FAILED] dialog-account-import remains registered after close exit animation!');
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[OVERLAY_ASSERTION_PASSED] dialog-account-import successfully unregistered after exit.');
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isImportDialogOpen, activeOverlayIds]);

  // Development assertion checks when actual state confirms completion
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      resetStage === null &&
      !hasActiveOverlay
    ) {
      const dialogRemaining = activeOverlayIds.has('dialog-account-reset');
      const hasScrim = document.querySelector('[class*="bg-[var(--flow-modal-scrim)]"]') !== null;
      
      if (dialogRemaining) {
        console.error('[OVERLAY_ASSERTION_FAILED] dialog-account-reset remains registered!');
      }
      if (hasScrim) {
        console.warn('[OVERLAY_ASSERTION_FAILED] blocking scrim still exists in DOM!');
      }

      if (dialogRemaining || hasScrim) {
        throw new Error('[OVERLAY_ASSERTION_FAILED] Account Reset Dialog lifecycle leak detected!');
      }
    }
  }, [resetStage, hasActiveOverlay, activeOverlayIds]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name || '',
    },
  });

  useEffect(() => {
    form.reset({ name: userProfile?.name || '' });
  }, [userProfile, form]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleRemindersToggle = async (checked: boolean) => {
    if (checked) {
      const { nativeBridge } = await import('@/lib/native-bridge');
      if (nativeBridge.isAndroid()) {
        const granted = await nativeBridge.requestNotificationPermission();
        if (granted) {
          setExpenseRemindersEnabled(true);
          setPermissionError(false);
        } else {
          setExpenseRemindersEnabled(false);
          setPermissionError(true);
        }
      } else {
        setExpenseRemindersEnabled(true);
      }
    } else {
      setExpenseRemindersEnabled(false);
      setPermissionError(false);
      const { nativeBridge } = await import('@/lib/native-bridge');
      if (nativeBridge.isAndroid()) {
        await nativeBridge.cancelExpenseReminder();
      }
    }
  };

  const handleNotificationTest = async () => {
    try {
      const { nativeBridge } = await import('@/lib/native-bridge');
      if (nativeBridge.isAndroid()) {
        const permission = await nativeBridge.checkNotificationPermission();
        if (!permission) {
          const granted = await nativeBridge.requestNotificationPermission();
          if (!granted) {
            return;
          }
        }
        await triggerTestReminder();
      }
    } catch (error: any) {
      console.error(error.message || 'Error scheduling test notification.');
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    const isNameChanged = (userProfile?.name || '') !== data.name;
    const shouldUpdateAvatar = isNameChanged && (userProfile?.isGeneratedAvatar || false);
  
    setUserProfile(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        name: data.name,
        avatarUrl: shouldUpdateAvatar ? null : prevUser.avatarUrl,
        isGeneratedAvatar: shouldUpdateAvatar ? true : prevUser.isGeneratedAvatar,
      };
    });
  
    setIsEditing(false);
  };

  const handleCancel = () => {
    form.reset({ name: userProfile?.name || '' });
    setIsEditing(false);
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (JPEG, PNG or WebP).');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size exceeds 5MB limit.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(objectUrl);
    setIsCropDialogOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setUserProfile(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        avatarUrl: croppedDataUrl,
        isGeneratedAvatar: false,
      };
    });
    setIsCropDialogOpen(false);
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    setAvatarError(null);
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    setAvatarError(null);
  };

  const handleExportJson = async (): Promise<boolean> => {
    setOperationError(null);
    try {
      setIsExporting(true);
      const jsonString = await generateBackupJSON();
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const fileName = `flow-backup-${dateStr}-${timeStr}.json`;

      if (Capacitor.isNativePlatform()) {
        const result = await nativeBridge.exportBackup({ fileName, json: jsonString });
        if (result && result.cancelled) {
          return false;
        }
        if (!result || !result.success) {
          throw new Error('Export was not successful.');
        }
        return true;
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error: any) {
      setOperationError(error.message || 'There was an error preparing export data.');
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeImport = async () => {
    setOperationError(null);
    try {
      setIsImporting(true);
      const pickerResult = await nativeBridge.importBackup();
      if (pickerResult.cancelled || !pickerResult.content) {
        return;
      }
      const migratedBackup = parseAndValidateBackup(pickerResult.content);
      const summary = {
        expensesCount: migratedBackup.data.expenses?.length || 0,
        categoriesCount: migratedBackup.data.categories?.length || 0,
        budgetsCount: migratedBackup.data.budgets?.length || 0,
        notesCount: migratedBackup.data.notes?.length || 0,
        version: migratedBackup.version,
      };
      setPendingImport({
        backup: migratedBackup,
        summary
      });
    } catch (error: any) {
      console.error('[IMPORT_DIAGNOSTIC] handleNativeImport error:', error.stack || error);
      setOperationError(error.message || 'Could not open backup file.');
      setPendingImport(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOperationError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setOperationError('File size exceeds 5MB limit.');
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const migratedBackup = parseAndValidateBackup(text);
        const summary = {
          expensesCount: migratedBackup.data.expenses?.length || 0,
          categoriesCount: migratedBackup.data.categories?.length || 0,
          budgetsCount: migratedBackup.data.budgets?.length || 0,
          notesCount: migratedBackup.data.notes?.length || 0,
          version: migratedBackup.version,
        };
        setPendingImport({
          backup: migratedBackup,
          summary
        });
      } catch (error: any) {
        console.error('[IMPORT_DIAGNOSTIC] handleImportJsonFile error:', error.stack || error);
        setOperationError(error.message || 'Could not parse data file.');
        setPendingImport(null);
      } finally {
        setIsImporting(false);
        if (jsonImportInputRef.current) {
          jsonImportInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      setOperationError('Could not read file.');
      setPendingImport(null);
      if (jsonImportInputRef.current) {
        jsonImportInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!pendingImport) return;

    try {
      const data = pendingImport.backup.data;
      
      await replaceAppData({
        expenses: data.expenses || [],
        categories: data.categories || [],
        budgets: data.budgets || [],
        notes: data.notes || [],
        dateEvents: data.dateEvents || {},
        userProfile: data.userProfile,
        currency: data.currency,
        experimentalSettings: data.experimentalSettings,
        colorThemeName: data.colorThemeName,
        graphStyle: data.graphStyle,
        graphXAxis: data.graphXAxis,
        expenseRemindersEnabled: data.expenseRemindersEnabled,
        isSampleData: false,
        onboarded: true,
        source: 'import'
      });

      cancelImport();
    } catch (error: any) {
      setOperationError(error.message || "Could not import data.");
      cancelImport();
    }
  };

  const handleResetData = async () => {
    try {
      await resetForFreshOnboarding();
      setResetStage(null);
    } catch (error: any) {
      console.error("Could not clear storage", error);
      setResetValidationError(error.message || 'Could not reset application data. Please try again.');
    }
  };

  if (!isLoaded || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8 pb-[calc(2.2rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]">
      <div className="space-y-8">
        <header className="text-left max-w-xl mx-auto lg:max-w-none">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">Account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Manage your account profile settings.</p>
        </header>

        <div className="grid grid-cols-1 gap-8 max-w-xl mx-auto lg:max-w-none">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="relative border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">Information</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">View and edit your personal details.</CardDescription>
                    </div>
                    <AnimatePresence mode="wait">
                      {!isEditing && (
                        <motion.div
                          key="pencil-edit"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setIsEditing(true)} 
                            className="h-11 w-11 rounded-xl"
                            aria-label="Edit profile"
                            title="Edit profile"
                          >
                            <Pencil className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-6">
                  <motion.div layout="position" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex flex-col items-center justify-center text-center gap-4">
                          <motion.div
                            layout
                            className="relative"
                          >
                            <FlowAvatar
                              name={userProfile.name}
                              avatarUrl={userProfile.avatarUrl}
                              isGeneratedAvatar={userProfile.isGeneratedAvatar}
                              className="w-28 h-28 border-4 border-background shadow-md ring-2 ring-primary/30"
                              fallbackClassName="text-4xl"
                            />
                            <Button
                              type="button"
                              variant="default"
                              size="icon"
                              onClick={() => avatarInputRef.current?.click()}
                              className="absolute -bottom-1 -right-1 h-11 w-11 bg-primary hover:bg-primary/95 text-primary-foreground border-2 border-background shadow-md rounded-full active:scale-95 transition-transform flex items-center justify-center"
                              aria-label="Change profile photo"
                              title="Change profile photo"
                            >
                              <Camera className="h-5 w-5" />
                            </Button>
                            <input
                              type="file"
                              ref={avatarInputRef}
                              className="hidden"
                              accept="image/png, image/jpeg"
                              onChange={handleAvatarChange}
                            />
                          </motion.div>

                          {avatarError && (
                            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold leading-relaxed text-center max-w-xs select-none">
                              {avatarError}
                            </div>
                          )}
                          
                          <motion.div layout className="w-full flex flex-col items-center justify-center min-h-[52px]">
                            <AnimatePresence mode="wait">
                              {isEditing ? (
                                <motion.div
                                  key="profile-edit-form"
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="w-full flex flex-col items-center"
                                >
                                  <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem className="w-64">
                                        <FormLabel className="sr-only">Display name</FormLabel>
                                        <FormControl>
                                          <Input 
                                            {...field}
                                            placeholder="Enter a display name"
                                            className="h-12 rounded-xl text-center text-base bg-background/50 focus-visible:ring-2 focus-visible:ring-primary"
                                          />
                                        </FormControl>
                                        <FormMessage className="text-xs text-destructive mt-1 text-center" />
                                      </FormItem>
                                    )}
                                  />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="profile-view"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="space-y-1 text-center"
                                >
                                  <h2 className="text-2xl font-bold text-foreground leading-tight">{userProfile.name}</h2>
                                  <p className="text-xs text-muted-foreground font-semibold">Local Profile</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
 
                        <AnimatePresence mode="wait">
                          {isEditing && (
                            <motion.div
                              key="edit-actions"
                              initial={{ opacity: 0, height: 0, y: 6 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: 6 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="flex justify-center gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={handleCancel} className="h-12 rounded-xl px-5 text-sm font-semibold btn-premium-touch">Cancel</Button>
                                <Button type="submit" className="h-12 rounded-xl px-5 text-sm font-semibold btn-premium-touch">Save profile</Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </form>
                    </Form>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Restructured Card 1: Automation & Protection */}
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 select-none">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-bold">Automation & Protection</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Configure background reminders for expense logging.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Reminder Row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="reminder-toggle" className="text-sm font-semibold text-foreground">
                        Reminder
                      </Label>
                      <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                        Remind me if I haven't added expenses for 6 hours.
                      </p>
                    </div>
                    <Switch
                      id="reminder-toggle"
                      checked={expenseRemindersEnabled}
                      onCheckedChange={handleRemindersToggle}
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {permissionError && (
                    <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold leading-relaxed text-left flex items-start gap-2 select-none">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Notification permissions are required to enable reminders. Please enable them in your system settings.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Restructured Card 2: Import & Export Data */}
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 select-none">
                  <CardTitle className="text-lg font-bold">Import & Export Data</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Save snapshots or restore your Flow database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-2">
                  {operationError && (
                    <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold leading-relaxed text-left flex items-start gap-2 select-none">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{operationError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Label className="text-sm font-semibold text-foreground">Import Backup</Label>
                      <p className="text-xs text-muted-foreground leading-normal mt-0.5">Restore database from a valid JSON file.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      disabled={isExporting || isImporting}
                      onClick={() => {
                        if (Capacitor.isNativePlatform()) {
                          void handleNativeImport();
                        } else {
                          jsonImportInputRef.current?.click();
                        }
                      }} 
                      className="h-11 rounded-xl px-4 text-xs font-semibold flex-shrink-0 flex items-center gap-2 active:scale-98"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-primary" />
                          Import
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={jsonImportInputRef}
                      className="hidden"
                      accept=".json"
                      onChange={handleImportJsonFile}
                    />
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Label className="text-sm font-semibold text-foreground">Export Backup</Label>
                      <p className="text-xs text-muted-foreground leading-normal mt-0.5">Save a JSON copy of your data locally.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleExportJson} 
                      disabled={isExporting || isImporting}
                      className="h-11 rounded-xl px-4 text-xs font-semibold flex-shrink-0 flex items-center gap-2 active:scale-98"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 text-primary" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Restructured Card 3: Reset Data */}
            <motion.div
              initial={{ opacity: 0, y: yVal }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border border-destructive/20 bg-card/60 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 select-none bg-destructive/[0.02]">
                  <CardTitle className="text-lg font-bold text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Irreversible actions that affect all application data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Label className="text-sm font-semibold text-destructive">Reset all data</Label>
                      <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                        Wipe all local transactions, budgets, categories, and settings.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setResetStage('backupRequired')}
                      className="h-11 rounded-xl px-4 text-xs font-semibold flex-shrink-0 active:scale-98"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <AvatarCropSheet
        id="sheet-account-crop"
        ownerId="account"
        imageSrc={avatarPreviewUrl}
        isOpen={isCropDialogOpen}
        onClose={handleCropCancel}
        onCrop={handleCropComplete}
      />

      <FlowDialog
        open={isResetFlowOpen}
        onOpenChange={handleResetOpenChange}
        onExitComplete={handleResetExitComplete}
        id="dialog-account-reset"
        ownerId="account"
        className="max-w-[380px] p-5 rounded-[24px]"
      >
        <ResetDialogContent
          userProfile={userProfile}
          onReset={handleResetData}
          onExport={handleExportJson}
          resetStage={resetStage}
          setResetStage={setResetStage}
          resetNameInput={resetNameInput}
          setResetNameInput={setResetNameInput}
          resetValidationError={resetValidationError}
          setResetValidationError={setResetValidationError}
          isVerifying={isVerifying}
          setIsVerifying={setIsVerifying}
          isResetting={isResetting}
          setIsResetting={setIsResetting}
          backupExportedForReset={backupExportedForReset}
          setBackupExportedForReset={setBackupExportedForReset}
          isExportingLocal={isExportingLocal}
          setIsExportingLocal={setIsExportingLocal}
          exportError={exportError}
          setExportError={setExportError}
          cancelResetFlow={cancelResetFlow}
        />
      </FlowDialog>

      {/* Confirmed Backup Import dialog */}
      <FlowDialog
        open={isImportDialogOpen}
        onOpenChange={handleImportOpenChange}
        id="dialog-account-import"
        ownerId="account"
        className="max-w-[380px] p-5 rounded-[24px]"
      >
        <div className="flex flex-col space-y-2 text-left">
          <h2 className="text-foreground font-bold text-lg text-left">Import Backup</h2>
          <div className="text-muted-foreground text-xs leading-relaxed space-y-3 text-left">
            <p>
              This will <strong className="text-foreground">completely replace</strong> your current local transactions, budgets, categories, and profile details with the data from this backup file.
            </p>
            
            {pendingImport?.backup?.data && (
              <div className="bg-muted/50 border border-border/40 rounded-2xl p-4 text-xs space-y-1 text-foreground text-left">
                <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-1 select-none">Backup Contents</p>
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold tabular-nums">{pendingImport.summary.expensesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categories:</span>
                  <span className="font-bold tabular-nums">{pendingImport.summary.categoriesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budgets:</span>
                  <span className="font-bold tabular-nums">{pendingImport.summary.budgetsCount}</span>
                </div>
                {pendingImport.backup.data.notes && (
                  <div className="flex justify-between">
                    <span>Notes:</span>
                    <span className="font-bold tabular-nums">{pendingImport.summary.notesCount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-bold">{pendingImport.summary.version}</span>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold select-none">
              This process reloads the app and cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-4 gap-2 flex flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={cancelImport} 
            className="rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch"
          >
            Cancel
          </Button>
          <Button 
            onClick={executeImport} 
            className="rounded-xl h-11 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground btn-premium-touch"
          >
            Import
          </Button>
        </div>
      </FlowDialog>
    </div>
  );
}

class AccountErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[IMPORT_DIAGNOSTIC] AccountErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container max-w-2xl py-8">
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">An error occurred</CardTitle>
              <CardDescription className="text-destructive/80">
                The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-semibold text-foreground">{this.state.error?.message}</p>
              <pre className="text-xs p-3 bg-background rounded-lg overflow-auto max-h-48 text-muted-foreground border border-border select-all">
                {this.state.error?.stack}
                {"\n\nComponent Stack:\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
              <Button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} variant="outline" className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AccountPage() {
  return (
    <AccountErrorBoundary>
      <AccountPageContent />
    </AccountErrorBoundary>
  );
}
