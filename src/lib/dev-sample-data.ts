import type { Category, Expense, Budget, Note } from '@/lib/types';

export const sampleCategories: Category[] = [
  { id: 'cat-1', name: 'Food', icon: 'UtensilsCrossed', color: '#ff6b6b' },
  { id: 'cat-2', name: 'Groceries', icon: 'ShoppingCart', color: '#f06595' },
  { id: 'cat-3', name: 'Transport', icon: 'Car', color: '#748ffc' },
  { id: 'cat-4', name: 'Shopping', icon: 'Briefcase', color: '#cc5de8' },
  { id: 'cat-5', name: 'Bills', icon: 'Zap', color: '#ffd43b' },
  { id: 'cat-6', name: 'Rent', icon: 'Home', color: '#a9e34b' },
  { id: 'cat-7', name: 'Health', icon: 'HeartPulse', color: '#38d9a9' },
  { id: 'cat-8', name: 'Entertainment', icon: 'Ticket', color: '#20c997' },
  { id: 'cat-9', name: 'Education', icon: 'Book', color: '#15aabf' },
  { id: 'cat-10', name: 'Travel', icon: 'Plane', color: '#228be6' },
  { id: 'cat-11', name: 'Family', icon: 'User', color: '#4c6ef5' },
  { id: 'cat-12', name: 'Subscriptions', icon: 'BookCopy', color: '#845ef7' },
  { id: 'cat-13', name: 'Personal Care', icon: 'Circle', color: '#e599f7' },
  { id: 'cat-14', name: 'Gifts', icon: 'Gift', color: '#ffd8a8' },
  { id: 'cat-15', name: 'Other', icon: 'MoreHorizontal', color: '#adb5bd' },
];

export interface DevSampleData {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  notes: Note[];
  dateEvents: Record<string, string>;
}

export function getDevSampleData(today: Date = new Date()): DevSampleData {
  // Helpers for relative dates
  const d = (daysAgo: number) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    date.setHours(12, 0, 0, 0);
    return date;
  };

  const m = (monthsAgo: number, dayOfMonth: number) => {
    const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, dayOfMonth);
    date.setHours(12, 0, 0, 0);
    return date;
  };

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthKey = getMonthKey(today);
  const lastMonthKey = getMonthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  const twoMonthsAgoKey = getMonthKey(new Date(today.getFullYear(), today.getMonth() - 2, 1));

  // 100 Deterministic Expenses
  const expenses: Expense[] = [
    // --- Current Month ---
    { id: 'exp-1', amount: 12.50, description: 'Lunch with team', category: 'Food', date: d(0), isOnline: true },
    { id: 'exp-2', amount: 45.00, description: 'Card shopping headphones', category: 'Shopping', date: d(0), isOnline: true },
    { id: 'exp-3', amount: 18.50, description: 'Weekend groceries fruits', category: 'Groceries', date: d(0), isOnline: false },
    { id: 'exp-4', amount: 8.20, description: 'Metro recharge subway', category: 'Transport', date: d(1), isOnline: false },
    { id: 'exp-5', amount: 15.00, description: 'Movie tickets IMAX', category: 'Entertainment', date: d(1), isOnline: true },
    { id: 'exp-6', amount: 850.00, description: 'Monthly rent apartment', category: 'Rent', date: d(2), isOnline: true },
    { id: 'exp-7', amount: 120.00, description: 'Electricity bill summer', category: 'Bills', date: d(2), isOnline: true },
    { id: 'exp-8', amount: 22.50, description: 'UPI coffee and snack', category: 'Food', date: d(2), isOnline: true },
    { id: 'exp-9', amount: 35.00, description: 'Medicine purchase clinic', category: 'Health', date: d(3), isOnline: false },
    { id: 'exp-10', amount: 9.99, description: 'Netflix streaming premium', category: 'Subscriptions', date: d(3), isOnline: true },
    { id: 'exp-11', amount: 80.00, description: 'Weekend groceries weekly', category: 'Groceries', date: d(4), isOnline: false },
    { id: 'exp-12', amount: 25.00, description: 'Hair cut hair salon', category: 'Personal Care', date: d(4), isOnline: false },
    { id: 'exp-13', amount: 60.00, description: 'Metro recharge fuel gas', category: 'Transport', date: d(5), isOnline: false },
    { id: 'exp-14', amount: 150.00, description: 'Anniversary gift watch', category: 'Gifts', date: d(5), isOnline: true },
    { id: 'exp-15', amount: 15.00, description: 'Face cream care', category: 'Personal Care', date: d(6), isOnline: false },
    { id: 'exp-16', amount: 110.00, description: 'Kids shoes sports', category: 'Family', date: d(6), isOnline: true },
    { id: 'exp-17', amount: 45.00, description: 'Dinner family restaurant', category: 'Food', date: d(7), isOnline: false },
    { id: 'exp-18', amount: 300.00, description: 'Flight tickets booking', category: 'Travel', date: d(7), isOnline: true },
    { id: 'exp-19', amount: 90.00, description: 'Online course webdev', category: 'Education', date: d(8), isOnline: true },
    { id: 'exp-20', amount: 15.00, description: 'Cab ride commute', category: 'Transport', date: d(8), isOnline: false },
    { id: 'exp-21', amount: 75.00, description: 'Fresh vegetables super', category: 'Groceries', date: d(9), isOnline: false },
    { id: 'exp-22', amount: 120.00, description: 'Water and garbage bill', category: 'Bills', date: d(9), isOnline: true },
    { id: 'exp-23', amount: 18.00, description: 'UPI coffee cafe latte', category: 'Food', date: d(10), isOnline: true },
    { id: 'exp-24', amount: 35.00, description: 'Museum entry ticket', category: 'Entertainment', date: d(10), isOnline: false },
    { id: 'exp-25', amount: 40.00, description: 'Leather wallet shopping', category: 'Shopping', date: d(11), isOnline: false },
    { id: 'exp-26', amount: 15.00, description: 'Office supplies binder note', category: 'Shopping', date: d(11), isOnline: true },
    { id: 'exp-27', amount: 20.00, description: 'Train card reload transit', category: 'Transport', date: d(12), isOnline: true },
    { id: 'exp-28', amount: 50.00, description: 'Dental cleaning checkup', category: 'Health', date: d(12), isOnline: false },
    { id: 'exp-29', amount: 120.00, description: 'Bulk groceries store', category: 'Groceries', date: d(13), isOnline: false },
    { id: 'exp-30', amount: 14.99, description: 'Spotify music premium', category: 'Subscriptions', date: d(13), isOnline: true },
    { id: 'exp-31', amount: 5.00, description: 'Cash snacks machine', category: 'Food', date: d(14), isOnline: false },
    { id: 'exp-32', amount: 350.00, description: 'Card shopping tech gadget', category: 'Shopping', date: d(14), isOnline: true },
    { id: 'exp-33', amount: 50.00, description: 'Flowers gift box', category: 'Gifts', date: d(15), isOnline: true },
    { id: 'exp-34', amount: 95.00, description: 'Weekend train ticket travel', category: 'Travel', date: d(15), isOnline: true },
    { id: 'exp-35', amount: 60.00, description: 'Broadband internet fiber bill', category: 'Bills', date: d(16), isOnline: true },
    { id: 'exp-36', amount: 12.50, description: 'Lunch sandwich and soda', category: 'Food', date: d(16), isOnline: false },
    { id: 'exp-37', amount: 25.00, description: 'Toll pass highway card', category: 'Transport', date: d(17), isOnline: true },
    { id: 'exp-38', amount: 200.00, description: 'Mobile postpaid family plan', category: 'Bills', date: d(17), isOnline: true },
    { id: 'exp-39', amount: 30.00, description: 'Theme park ticket ride', category: 'Entertainment', date: d(18), isOnline: false },
    { id: 'exp-40', amount: 8.50, description: 'Toll pass auto charge', category: 'Transport', date: d(18), isOnline: true },
    { id: 'exp-41', amount: 65.00, description: 'Pub dinner drinks Jane', category: 'Food', date: d(19), isOnline: false },
    { id: 'exp-42', amount: 15.00, description: 'Shampoo and toiletries care', category: 'Personal Care', date: d(19), isOnline: false },
    { id: 'exp-43', amount: 80.00, description: 'Grocery shopping bread milk', category: 'Groceries', date: d(20), isOnline: false },
    { id: 'exp-44', amount: 360.00, description: 'Cloud certificate course', category: 'Education', date: d(20), isOnline: true },

    // --- Last Month ---
    { id: 'exp-45', amount: 850.00, description: 'Monthly rent apartment', category: 'Rent', date: m(1, 2), isOnline: true },
    { id: 'exp-46', amount: 120.00, description: 'Electricity bill summer', category: 'Bills', date: m(1, 3), isOnline: true },
    { id: 'exp-47', amount: 15.00, description: 'Lunch sandwich and soda', category: 'Food', date: m(1, 5), isOnline: false },
    { id: 'exp-48', amount: 8.20, description: 'Metro recharge subway', category: 'Transport', date: m(1, 6), isOnline: false },
    { id: 'exp-49', amount: 92.50, description: 'Weekend groceries weekly', category: 'Groceries', date: m(1, 8), isOnline: false },
    { id: 'exp-50', amount: 110.00, description: 'Card shopping headphones', category: 'Shopping', date: m(1, 10), isOnline: true },
    { id: 'exp-51', amount: 45.00, description: 'Medicine purchase clinic', category: 'Health', date: m(1, 12), isOnline: false },
    { id: 'exp-52', amount: 9.99, description: 'Netflix streaming premium', category: 'Subscriptions', date: m(1, 13), isOnline: true },
    { id: 'exp-53', amount: 50.00, description: 'Movie tickets IMAX', category: 'Entertainment', date: m(1, 15), isOnline: true },
    { id: 'exp-54', amount: 60.00, description: 'Metro recharge fuel gas', category: 'Transport', date: m(1, 16), isOnline: false },
    { id: 'exp-55', amount: 75.00, description: 'Anniversary gift watch', category: 'Gifts', date: m(1, 18), isOnline: true },
    { id: 'exp-56', amount: 85.00, description: 'Grocery shopping bread milk', category: 'Groceries', date: m(1, 19), isOnline: false },
    { id: 'exp-57', amount: 220.00, description: 'Flight tickets booking', category: 'Travel', date: m(1, 21), isOnline: true },
    { id: 'exp-58', amount: 35.00, description: 'Dinner family restaurant', category: 'Food', date: m(1, 22), isOnline: false },
    { id: 'exp-59', amount: 210.00, description: 'Water and garbage bill', category: 'Bills', date: m(1, 24), isOnline: true },
    { id: 'exp-60', amount: 25.00, description: 'Hair cut hair salon', category: 'Personal Care', date: m(1, 25), isOnline: false },
    { id: 'exp-61', amount: 140.00, description: 'Kids shoes sports', category: 'Family', date: m(1, 26), isOnline: true },
    { id: 'exp-62', amount: 99.00, description: 'Online course webdev', category: 'Education', date: m(1, 28), isOnline: true },
    { id: 'exp-63', amount: 20.00, description: 'Leather wallet shopping', category: 'Shopping', date: m(1, 29), isOnline: false },
    { id: 'exp-64', amount: 55.00, description: 'Pub dinner drinks Jane', category: 'Food', date: m(1, 30), isOnline: false },
    { id: 'exp-65', amount: 10.00, description: 'Toll pass highway card', category: 'Transport', date: m(1, 15), isOnline: true },
    { id: 'exp-66', amount: 4.50, description: 'Cash snacks machine', category: 'Food', date: m(1, 4), isOnline: false },
    { id: 'exp-67', amount: 120.00, description: 'Bulk groceries store', category: 'Groceries', date: m(1, 12), isOnline: false },
    { id: 'exp-68', amount: 14.99, description: 'Spotify music premium', category: 'Subscriptions', date: m(1, 14), isOnline: true },
    { id: 'exp-69', amount: 35.00, description: 'Dental cleaning checkup', category: 'Health', date: m(1, 18), isOnline: false },
    { id: 'exp-70', amount: 22.50, description: 'Shampoo and toiletries care', category: 'Personal Care', date: m(1, 20), isOnline: false },
    { id: 'exp-71', amount: 80.00, description: 'Card shopping tech gadget', category: 'Shopping', date: m(1, 21), isOnline: true },
    { id: 'exp-72', amount: 15.00, description: 'Face cream care', category: 'Personal Care', date: m(1, 22), isOnline: false },
    { id: 'exp-73', amount: 30.00, description: 'Theme park ticket ride', category: 'Entertainment', date: m(1, 24), isOnline: false },
    { id: 'exp-74', amount: 120.00, description: 'Flowers gift box', category: 'Gifts', date: m(1, 27), isOnline: true },

    // --- Two Months Ago ---
    { id: 'exp-75', amount: 850.00, description: 'Monthly rent apartment', category: 'Rent', date: m(2, 2), isOnline: true },
    { id: 'exp-76', amount: 120.00, description: 'Electricity bill summer', category: 'Bills', date: m(2, 3), isOnline: true },
    { id: 'exp-77', amount: 12.50, description: 'Lunch sandwich and soda', category: 'Food', date: m(2, 5), isOnline: false },
    { id: 'exp-78', amount: 8.20, description: 'Metro recharge subway', category: 'Transport', date: m(2, 6), isOnline: false },
    { id: 'exp-79', amount: 78.00, description: 'Weekend groceries weekly', category: 'Groceries', date: m(2, 8), isOnline: false },
    { id: 'exp-80', amount: 45.00, description: 'Card shopping headphones', category: 'Shopping', date: m(2, 10), isOnline: true },
    { id: 'exp-81', amount: 20.00, description: 'Medicine purchase clinic', category: 'Health', date: m(2, 12), isOnline: false },
    { id: 'exp-82', amount: 9.99, description: 'Netflix streaming premium', category: 'Subscriptions', date: m(2, 13), isOnline: true },
    { id: 'exp-83', amount: 25.00, description: 'Movie tickets IMAX', category: 'Entertainment', date: m(2, 15), isOnline: true },
    { id: 'exp-84', amount: 60.00, description: 'Metro recharge fuel gas', category: 'Transport', date: m(2, 16), isOnline: false },
    { id: 'exp-85', amount: 50.00, description: 'Anniversary gift watch', category: 'Gifts', date: m(2, 18), isOnline: true },
    { id: 'exp-86', amount: 110.00, description: 'Grocery shopping bread milk', category: 'Groceries', date: m(2, 19), isOnline: false },
    { id: 'exp-87', amount: 180.00, description: 'Flight tickets booking', category: 'Travel', date: m(2, 21), isOnline: true },
    { id: 'exp-88', amount: 22.50, description: 'Dinner family restaurant', category: 'Food', date: m(2, 22), isOnline: false },
    { id: 'exp-89', amount: 190.00, description: 'Water and garbage bill', category: 'Bills', date: m(2, 24), isOnline: true },
    { id: 'exp-90', amount: 25.00, description: 'Hair cut hair salon', category: 'Personal Care', date: m(2, 25), isOnline: false },
    { id: 'exp-91', amount: 75.00, description: 'Kids shoes sports', category: 'Family', date: m(2, 26), isOnline: true },
    { id: 'exp-92', amount: 50.00, description: 'Online course webdev', category: 'Education', date: m(2, 28), isOnline: true },
    { id: 'exp-93', amount: 10.00, description: 'Toll pass highway card', category: 'Transport', date: m(2, 29), isOnline: true },
    { id: 'exp-94', amount: 40.00, description: 'Pub dinner drinks Jane', category: 'Food', date: m(2, 30), isOnline: false },
    { id: 'exp-95', amount: 320.00, description: 'Sightseeing trip expenses', category: 'Travel', date: m(2, 15), isOnline: true },
    { id: 'exp-96', amount: 150.00, description: 'Office setup keyboard', category: 'Shopping', date: m(2, 10), isOnline: true },
    { id: 'exp-97', amount: 55.00, description: 'Extra garbage fee bill', category: 'Bills', date: m(2, 4), isOnline: true },
    { id: 'exp-98', amount: 120.00, description: 'Therapist session fee', category: 'Health', date: m(2, 12), isOnline: false },
    { id: 'exp-99', amount: 65.00, description: 'Organic farm groceries', category: 'Groceries', date: m(2, 20), isOnline: false },
    { id: 'exp-100', amount: 30.00, description: 'Gifts wrap accessory', category: 'Gifts', date: m(2, 18), isOnline: true }
  ];

  // Deterministic Budgets
  const budgetLimits = [
    { category: 'Food', limit: 500 },
    { category: 'Groceries', limit: 400 },
    { category: 'Transport', limit: 150 },
    { category: 'Shopping', limit: 300 },
    { category: 'Bills', limit: 500 },
    { category: 'Rent', limit: 850 },
    { category: 'Health', limit: 200 },
    { category: 'Entertainment', limit: 100 },
    { category: 'Education', limit: 500 },
    { category: 'Travel', limit: 600 },
    { category: 'Family', limit: 300 },
    { category: 'Subscriptions', limit: 30 },
    { category: 'Personal Care', limit: 100 },
    { category: 'Gifts', limit: 150 },
    { category: 'Other', limit: 50 }
  ];

  const getBudgetsForMonth = (monthKey: string): Budget[] => {
    return budgetLimits.map(bl => {
      const cat = sampleCategories.find(c => c.name === bl.category);
      return {
        category: bl.category,
        limit: bl.limit,
        month: monthKey,
        categoryName: bl.category,
        categoryIcon: cat?.icon || 'Circle',
        categoryColor: cat?.color || '#808080'
      };
    });
  };

  const budgets: Budget[] = [
    ...getBudgetsForMonth(currentMonthKey),
    ...getBudgetsForMonth(lastMonthKey),
    ...getBudgetsForMonth(twoMonthsAgoKey)
  ];

  // Deterministic Notes
  const notes: Note[] = [
    { id: 'note-1', amount: 22.50, description: 'Lunch slice share', category: 'Food', date: d(2), person: 'Jane Doe' },
    { id: 'note-2', amount: 120.00, description: 'Shared hotel cost room', category: 'Travel', date: d(7), person: 'Chris Green' },
    { id: 'note-3', amount: 25.00, description: 'Gas refill weekend trip', category: 'Transport', date: d(7), person: 'David Black' },
    { id: 'note-4', amount: 15.00, description: 'Museum entry tickets group', category: 'Entertainment', date: d(6), person: 'Chris Green' },
    { id: 'note-5', amount: 55.00, description: 'Birthday gifts packages', category: 'Gifts', date: d(5), person: 'Sarah Miller' },
    { id: 'note-6', amount: 80.00, description: 'Technical event ticket share', category: 'Education', date: d(10), person: 'Emily White' },
    { id: 'note-7', amount: 40.00, description: 'Conference lunch share', category: 'Food', date: d(9), person: 'Emily White' },
    { id: 'note-8', amount: 15.00, description: 'Uber taxi share ride', category: 'Transport', date: d(9), person: 'Sarah Miller' }
  ];

  // Dynamic Date-to-Event string map based on relative date strings
  const formatDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const dateEvents: Record<string, string> = {
    [formatDateKey(d(7))]: 'Weekend Trip',
    [formatDateKey(d(6))]: 'Weekend Trip',
    [formatDateKey(d(5))]: "David's Birthday",
    [formatDateKey(d(10))]: 'Tech Conference',
    [formatDateKey(d(9))]: 'Tech Conference'
  };

  return {
    categories: sampleCategories,
    expenses,
    budgets,
    notes,
    dateEvents
  };
}
