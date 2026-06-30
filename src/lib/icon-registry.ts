/**
 * Canonical registry for categories, icons, colors, currencies, and palettes.
 * Shared by the category picker, icon renderer, validator, and backup system.
 */

export const SUPPORTED_ICONS = [
  'ShoppingCart',
  'UtensilsCrossed',
  'Car',
  'Ticket',
  'HeartPulse',
  'Zap',
  'Home',
  'Circle',
  'Construction',
  'Landmark',
  'PiggyBank',
  'Book',
  'Plane',
  'Gift',
  'MoreHorizontal',
  'Briefcase',
  'BookCopy',
  'User',
  'ShoppingBag',
  'Bus',
  'Train',
  'Fuel',
  'Tv',
  'Music',
  'Pill',
  'Phone',
  'Wifi',
  'Building',
  'BookOpen',
  'Luggage',
  'Users',
  'Wallet',
  'CreditCard',
  'Receipt',
  'Repeat',
  'Shield',
  'Dumbbell',
  'PawPrint',
  'Shirt',
  'Sparkles',
  'Wrench'
];

export const CURATED_ICONS = [
  'ShoppingCart', 'UtensilsCrossed', 'ShoppingBag', 'Car',
  'Bus', 'Train', 'Fuel', 'Ticket',
  'Tv', 'Music', 'HeartPulse', 'Pill',
  'Zap', 'Phone', 'Wifi', 'Home',
  'Building', 'BookOpen', 'Plane', 'Luggage',
  'Gift', 'User', 'Users', 'PiggyBank',
  'Wallet', 'CreditCard', 'Receipt', 'Repeat',
  'Shield', 'Dumbbell', 'PawPrint', 'Shirt',
  'Sparkles', 'Wrench', 'Construction', 'Landmark',
  'Book', 'Briefcase', 'BookCopy', 'Circle',
  'MoreHorizontal'
];

/**
 * Case-insensitive and legacy name aliases mapping to the canonical Lucide React icon names.
 */
export const ICON_ALIASES: Record<string, string> = {
  'shopping-cart': 'ShoppingCart',
  'shoppingcart': 'ShoppingCart',
  'utensils-crossed': 'UtensilsCrossed',
  'utensilscrossed': 'UtensilsCrossed',
  'heart-pulse': 'HeartPulse',
  'heartpulse': 'HeartPulse',
  'more-horizontal': 'MoreHorizontal',
  'morehorizontal': 'MoreHorizontal',
  'piggy-bank': 'PiggyBank',
  'piggybank': 'PiggyBank',
  'book-copy': 'BookCopy',
  'bookcopy': 'BookCopy',
  'shopping-bag': 'ShoppingBag',
  'shoppingbag': 'ShoppingBag',
  'book-open': 'BookOpen',
  'bookopen': 'BookOpen',
  'credit-card': 'CreditCard',
  'creditcard': 'CreditCard',
  'paw-print': 'PawPrint',
  'pawprint': 'PawPrint',
  'fast-forward': 'Repeat',
  'fastforward': 'Repeat',
  'wifi': 'Wifi',
  'automobile': 'Car',
  'airplane': 'Plane',
  'education': 'Book',
  'transport': 'Car',
  'subway': 'Train',
  'telephony': 'Phone',
  'electricity': 'Zap',
  'entertainment': 'Ticket',
  'utilities': 'Construction',
  'subscription': 'BookCopy',
};

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL', 'RUB', 'ZAR', 'MXN', 'SGD', 'HKD', 'NZD', 'SEK', 'KRW', 'NOK', 'TRY'
];

export const SUPPORTED_PALETTES = [
  'Ocean', 'Violet', 'Orchid', 'Mint', 'Sky', 'Sunset', 'Forest', 'Ruby'
];
