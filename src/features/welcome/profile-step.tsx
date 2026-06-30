'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Camera } from 'lucide-react';
import { FlowAvatar } from '@/components/ui/flow-avatar';
import { useApp } from '@/components/providers/app-provider';
import { AvatarCropSheet, pickAndNormalizeAvatarImage } from '@/features/account/components/avatar-crop-sheet';

import { useReducedMotion } from 'framer-motion';

const profileSchema = z.object({
  name: z.string()
    .refine(val => val.trim().length > 0, { message: 'Enter a display name.' })
    .refine(val => val.trim().length <= 100, { message: 'Name must be 100 characters or less.' }),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileStepProps {
  setNextDisabled?: (disabled: boolean) => void;
  setOnNext?: (handler: (() => void) | null) => void;
  setNextLabel?: (label: string) => void;
}

export function ProfileStep({
  setNextDisabled,
  setOnNext,
  setNextLabel,
}: ProfileStepProps) {
  const { userProfile: initialProfile, setUserProfile, nextStep } = useApp();
  const shouldReduceMotion = useReducedMotion();
  
  const [isGeneratedAvatar, setIsGeneratedAvatar] = useState<boolean>(() => {
    if (initialProfile) {
      return initialProfile.isGeneratedAvatar;
    }
    return true;
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (initialProfile && !initialProfile.isGeneratedAvatar) {
      return initialProfile.avatarUrl;
    }
    return null;
  });

  const [isCropSheetOpen, setIsCropSheetOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialProfile?.name?.trim() || 'Apex Studio',
    },
  });

  const currentName = form.watch('name') || '';

  // Synchronize avatarUrl if it is a generated avatar
  useEffect(() => {
    if (isGeneratedAvatar) {
      setAvatarUrl(null);
    }
  }, [currentName, isGeneratedAvatar]);

  const handleAvatarPick = async () => {
    setFileError(null);
    try {
      const res = await pickAndNormalizeAvatarImage();
      if (!res) return;
      setAvatarPreviewUrl(res.previewSrc);
      setIsCropSheetOpen(true);
    } catch (err: any) {
      setFileError(err.message || 'Failed to select image.');
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    setIsGeneratedAvatar(false);
    setIsCropSheetOpen(false);
    setAvatarPreviewUrl(null);
  };

  const handleCropCancel = () => {
    setIsCropSheetOpen(false);
    setAvatarPreviewUrl(null);
  };

  const handleSubmit = useCallback(async () => {
    const rawName = form.getValues('name') || '';
    const trimmedName = rawName.trim();
    
    // Set the trimmed name back to the form
    form.setValue('name', trimmedName, { shouldValidate: true });

    const isValid = await form.trigger('name');
    if (isValid) {
      setUserProfile({
        name: trimmedName,
        avatarUrl: isGeneratedAvatar ? null : avatarUrl,
        isGeneratedAvatar,
      });
      nextStep();
    } else {
      // Inline FormMessage handles rendering the validation error automatically
    }
  }, [form, avatarUrl, isGeneratedAvatar, setUserProfile, nextStep]);

  useEffect(() => {
    if (setNextLabel) setNextLabel('Continue');
    // Keep Continue enabled so that the user can tap it to trigger validation
    if (setNextDisabled) setNextDisabled(false);
  }, [setNextLabel, setNextDisabled]);

  useEffect(() => {
    if (setOnNext) setOnNext(handleSubmit);
    return () => {
      if (setOnNext) setOnNext(null);
    };
  }, [setOnNext, handleSubmit]);

  return (
    <div className="flex flex-col items-stretch w-full max-w-sm mx-auto px-4 select-none font-sans">
      {/* Title & Description */}
      <div className="text-center mb-6">
        <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-2 leading-none">
          Create your profile
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Set up your display name and optional profile picture.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
          <div className="flex flex-col items-center gap-6">
            {/* Avatar upload wrapper */}
            <div className="relative group cursor-pointer">
              <FlowAvatar
                name={currentName}
                avatarUrl={avatarUrl}
                isGeneratedAvatar={isGeneratedAvatar}
                className="w-24 h-24 border-2 transition-all duration-300 ring-4 ring-primary/5"
                fallbackClassName="text-3xl"
              />
              <button
                type="button"
                onClick={handleAvatarPick}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full border border-background shadow-md hover:bg-primary/95 transition-all duration-200"
                aria-label="Upload profile image"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            {fileError && (
              <p className="text-xs font-semibold text-destructive text-center mt-1 max-w-[200px]">{fileError}</p>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full space-y-1.5">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Apex Studio" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        if (isGeneratedAvatar) {
                          setAvatarUrl(null);
                        }
                      }}
                      className="h-11 rounded-xl bg-background/50 border-border/85 focus-visible:ring-1 focus-visible:ring-primary transition-all"
                    />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground font-medium leading-normal pl-1">
                    This name appears in your local profile.
                  </p>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      <AvatarCropSheet
        imageSrc={avatarPreviewUrl}
        isOpen={isCropSheetOpen}
        onClose={handleCropCancel}
        onCrop={handleCropComplete}
      />
    </div>
  );
}
