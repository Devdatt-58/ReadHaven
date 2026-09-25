export interface MobileNavItem {
  href: string;
  label: string;
  icon: string;
  matchMode?: 'exact' | 'prefix';
}

export const primaryMobileNavItems: MobileNavItem[] = [
  { href: '/', label: 'Home', icon: 'fas fa-home', matchMode: 'exact' },
  { href: '/search', label: 'Search', icon: 'fas fa-search', matchMode: 'prefix' },
  { href: '/discover', label: 'Discover', icon: 'fas fa-compass', matchMode: 'prefix' },
  { href: '/feed', label: 'Feed', icon: 'fas fa-rss', matchMode: 'prefix' },
  { href: '/reviews', label: 'Reviews', icon: 'fas fa-star', matchMode: 'prefix' },
  { href: '/friends', label: 'Friends', icon: 'fas fa-users', matchMode: 'prefix' },
  { href: '/statistics', label: 'Stats', icon: 'fas fa-chart-bar', matchMode: 'prefix' },
  {
    href: '/reading-challenge',
    label: 'Challenge',
    icon: 'fas fa-trophy',
    matchMode: 'prefix',
  },
];

export function getAccountNavItems(isAuthenticated: boolean): MobileNavItem[] {
  if (!isAuthenticated) {
    return [
      { href: '/login', label: 'Sign In', icon: 'fas fa-sign-in-alt', matchMode: 'prefix' },
      { href: '/signup', label: 'Sign Up', icon: 'fas fa-user-plus', matchMode: 'prefix' },
    ];
  }

  return [
    { href: '/profile', label: 'Profile', icon: 'fas fa-user', matchMode: 'prefix' },
    { href: '/create-post', label: 'Create Post', icon: 'fas fa-plus-circle', matchMode: 'prefix' },
    { href: '/friends', label: 'Friends', icon: 'fas fa-user-friends', matchMode: 'prefix' },
    { href: '/reviews', label: 'My Reviews', icon: 'fas fa-star', matchMode: 'prefix' },
  ];
}

