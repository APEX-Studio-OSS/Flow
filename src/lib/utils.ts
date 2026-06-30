
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Budget, Category, Expense } from '@/types/domain'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD") {
  // Normalize amount to a number, defaulting to 0 if NaN/undefined/null
  const cleanAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  // Safe default for currency
  const cleanCurrency = currency && typeof currency === 'string' && currency.trim() !== '' ? currency : 'USD';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cleanCurrency,
      minimumFractionDigits: 2,
    }).format(cleanAmount);
  } catch (e) {
    try {
      // Try USD format fallback, then prepend/append currency code if needed
      const formattedUSD = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(cleanAmount);
      
      if (cleanCurrency !== 'USD') {
        return `${cleanCurrency} ${formattedUSD.replace('$', '')}`;
      }
      return formattedUSD;
    } catch (err) {
      return `$${cleanAmount.toFixed(2)}`;
    }
  }
}

export function getCurrencySymbol(currency: string = 'USD') {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    const parts = formatter.formatToParts(1);
    const currencyPart = parts.find(part => part.type === 'currency');
    return currencyPart ? currencyPart.value : '$';
  } catch (e) {
    return '$';
  }
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options || defaultOptions);
}

export function formatDay(date: Date) {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
  });
}

export const generateColor = (str: string, isDark: boolean) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = isDark ? 60 : 70;
    const l = isDark ? 70 : 50;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export const getSafeAvatarInitial = (name: string): string => {
  if (!name) return '';
  const normalized = name.normalize('NFC');
  const trimmed = normalized.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const segments = trimmed.split(/[\s-]+/).filter(Boolean);
  if (segments.length === 0) return '';

  const getFirstValidGrapheme = (seg: string): string | null => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        for (const { segment } of segmenter.segment(seg)) {
          if (/^[\p{L}\p{N}]$/u.test(segment)) {
            return segment;
          }
        }
      } catch (e) {
        // Fallback
      }
    }
    try {
      const chars = Array.from(seg);
      for (const char of chars) {
        if (/^[\p{L}\p{N}]$/u.test(char)) {
          return char;
        }
      }
    } catch (e) {
      // Fallback
    }
    return null;
  };

  const validChars: string[] = [];
  for (const seg of segments) {
    const char = getFirstValidGrapheme(seg);
    if (char !== null) {
      validChars.push(char);
    }
  }

  if (validChars.length === 0) {
    return '';
  }

  let initials = '';
  if (validChars.length === 1) {
    initials = validChars[0];
  } else {
    initials = `${validChars[0]}${validChars[validChars.length - 1]}`;
  }

  initials = initials.toUpperCase();

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const graphemes = Array.from(segmenter.segment(initials)).map(s => s.segment);
      initials = graphemes.slice(0, 2).join('');
    } catch (e) {
      initials = Array.from(initials).slice(0, 2).join('');
    }
  } else {
    initials = Array.from(initials).slice(0, 2).join('');
  }

  return initials || '';
};

export const generateAvatarUrl = (name: string) => {
  try {
    if (!name) return '';
    
    const initials = getSafeAvatarInitial(name);
    
    const bgColor = '#7c3aed';
    const fgColor = '#ffffff';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" fill="${bgColor}" />
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="64"
          font-weight="bold"
          fill="${fgColor}"
          text-anchor="middle"
          dy=".3em">
          ${initials}
        </text>
      </svg>
    `.trim();

    let base64Svg = '';
    try {
      const bytes = new TextEncoder().encode(svg);
      let binString = '';
      for (let i = 0; i < bytes.length; i++) {
        binString += String.fromCharCode(bytes[i]);
      }
      base64Svg = btoa(binString);
    } catch (e) {
      base64Svg = btoa(unescape(encodeURIComponent(svg)));
    }

    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error('Failed to generate avatar URL:', error);
    // Safe base64 fallback SVG containing "?"
    return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiM3YzNhZWQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjY0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPj88L3RleHQ+PC9zdmc+`;
  }
};

export const getCurrentMonthKey = (date: Date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function getExpenseMonth(date: Date | string): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 7);
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  } else if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return getCurrentMonthKey();
}

export function getBudgetsForMonth(budgets: Budget[], month: string): Budget[] {
  return budgets.filter(b => b.month === month);
}

export function getAllocatedCategoryNamesForMonth(budgets: Budget[], month: string): Set<string> {
  const set = new Set<string>();
  const len = budgets.length;
  for (let i = 0; i < len; i++) {
    const b = budgets[i];
    if (b && b.month === month) {
      set.add(b.category);
    }
  }
  return set;
}

export function isCategoryAllocatedForMonth(budgets: Budget[], categoryName: string, month: string): boolean {
  return budgets.some(b => b.category === categoryName && b.month === month);
}

export function getExpenseCategoryOptionsForMonth(categories: Category[], budgets: Budget[], month: string): Category[] {
  const allocated = getAllocatedCategoryNamesForMonth(budgets, month);
  return categories.filter(c => allocated.has(c.name) || c.name.toLowerCase() === 'other');
}

export function isHistoricalMonth(month: string): boolean {
  const currentMonth = getCurrentMonthKey();
  return month < currentMonth;
}

export function canEditBudget(month: string): boolean {
  return !isHistoricalMonth(month);
}

export function canDeleteCategoryPermanently(expenses: Expense[], categoryName: string): boolean {
  if (categoryName.toLowerCase() === 'other') return false;
  return !expenses.some(e => e.category === categoryName);
}

export function validateLogoutName(input: string, expected: string): boolean {
  return input === expected;
}


    