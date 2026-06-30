'use client';

import type { UserProfile } from '@/types/domain';

export type AppAccessState = 'initializing' | 'requiresOnboarding' | 'ready' | 'clearing';

const SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL',
  'RUB', 'ZAR', 'MXN', 'SGD', 'HKD', 'NZD', 'SEK', 'KRW', 'NOK', 'TRY'
]);

const SUPPORTED_PALETTES = new Set([
  'Ocean', 'Violet', 'Orchid', 'Mint', 'Sky', 'Sunset', 'Forest', 'Ruby'
]);

/**
 * Validates the core app access properties.
 */
export function resolveAppAccessState(options: {
  onboarded: boolean | undefined;
  userProfile: UserProfile | null | undefined;
  currency: string | null | undefined;
  colorThemeName: string | null | undefined;
  categories: any[] | null | undefined;
}): 'ready' | 'requiresOnboarding' {
  const { onboarded, userProfile, currency, colorThemeName, categories } = options;

  if (onboarded !== true) {
    return 'requiresOnboarding';
  }

  // Validate profile
  if (
    !userProfile ||
    typeof userProfile !== 'object' ||
    !userProfile.name ||
    typeof userProfile.name !== 'string' ||
    userProfile.name.trim().length === 0 ||
    userProfile.name.trim().length > 100
  ) {
    return 'requiresOnboarding';
  }

  // Validate currency
  if (!currency || typeof currency !== 'string' || !SUPPORTED_CURRENCIES.has(currency)) {
    return 'requiresOnboarding';
  }

  // Validate color palette
  if (!colorThemeName || typeof colorThemeName !== 'string' || !SUPPORTED_PALETTES.has(colorThemeName)) {
    return 'requiresOnboarding';
  }

  // Validate categories
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return 'requiresOnboarding';
  }

  return 'ready';
}

/**
 * Safety Invariant check: Checks whether setup/onboarding has been completed
 * with a valid profile name. This is the single source of truth for app access.
 */
export function isSetupComplete(
  onboarded: boolean | undefined,
  userProfile: UserProfile | null | undefined,
  currency?: string | null | undefined,
  colorThemeName?: string | null | undefined,
  categories?: any[] | null | undefined
): boolean {
  if (currency === undefined && colorThemeName === undefined && categories === undefined) {
    return (
      onboarded === true &&
      !!userProfile &&
      typeof userProfile === 'object' &&
      !!userProfile.name &&
      userProfile.name.trim().length > 0
    );
  }

  return resolveAppAccessState({
    onboarded,
    userProfile,
    currency,
    colorThemeName,
    categories
  }) === 'ready';
}
