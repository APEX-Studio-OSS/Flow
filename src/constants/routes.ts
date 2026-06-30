export const ROUTES = {
  dashboard: '/dashboard',
  expenses: '/expenses',
  graph: '/graph',
  budgets: '/budgets',
  account: '/account',
  settings: '/settings',
  about: '/settings/about',
  notes: '/notes',
} as const;

export const MAIN_ROUTES = [
  ROUTES.dashboard,
  ROUTES.expenses,
  ROUTES.graph,
  ROUTES.budgets,
  ROUTES.account,
  ROUTES.settings,
  ROUTES.notes,
] as const;

export function isMainRoute(pathname: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  return (MAIN_ROUTES as readonly string[]).includes(cleanPath);
}

export function getBackDestination(pathname: string): string {
  if (!pathname) return ROUTES.dashboard;
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  if (cleanPath === ROUTES.about) {
    return ROUTES.settings;
  }
  return ROUTES.dashboard;
}
