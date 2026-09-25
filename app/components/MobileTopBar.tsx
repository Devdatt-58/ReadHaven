'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileDrawer from './MobileDrawer';
import { MobileNavItem } from './mobile-nav';

interface MobileTopBarAction {
  href: string;
  label: string;
  icon?: string;
}

interface Props {
  title: string;
  backHref?: string;
  primaryAction?: MobileTopBarAction;
  showProfileTrigger?: boolean;
  navItems: MobileNavItem[];
  profileItems?: MobileNavItem[];
}

function isActivePath(pathname: string, item: MobileNavItem) {
  if (item.matchMode === 'exact') {
    return pathname === item.href;
  }

  if (item.href === '/') {
    return pathname === '/';
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function DrawerLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: MobileNavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className={`mobile-drawer-link ${isActivePath(pathname, item) ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <i className={item.icon} aria-hidden="true"></i>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function MobileTopBar({
  title,
  backHref,
  primaryAction,
  showProfileTrigger = false,
  navItems,
  profileItems = [],
}: Props) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLabel = useMemo(() => `${title} navigation`, [title]);
  const profileLabel = useMemo(() => `${title} account menu`, [title]);

  return (
    <>
      <div className="mobile-topbar" role="banner">
        <div className="mobile-topbar-left">
          <button
            type="button"
            className="mobile-topbar-icon"
            aria-label="Open navigation menu"
            onClick={() => setIsNavOpen(true)}
          >
            <i className="fas fa-bars" aria-hidden="true"></i>
          </button>
          {backHref ? (
            <Link href={backHref} className="mobile-topbar-back" aria-label="Go back">
              <i className="fas fa-chevron-left" aria-hidden="true"></i>
            </Link>
          ) : null}
        </div>

        <div className="mobile-topbar-center">
          <span className="mobile-topbar-title">{title}</span>
        </div>

        <div className="mobile-topbar-right">
          {primaryAction ? (
            <Link href={primaryAction.href} className="mobile-topbar-action">
              {primaryAction.icon ? <i className={primaryAction.icon} aria-hidden="true"></i> : null}
              <span>{primaryAction.label}</span>
            </Link>
          ) : null}
          {showProfileTrigger ? (
            <button
              type="button"
              className="mobile-topbar-icon"
              aria-label="Open profile shortcuts"
              onClick={() => setIsProfileOpen(true)}
            >
              <i className="fas fa-user-circle" aria-hidden="true"></i>
            </button>
          ) : null}
        </div>
      </div>

      <MobileDrawer side="left" open={isNavOpen} label={navLabel} onClose={() => setIsNavOpen(false)}>
        <DrawerLinks items={navItems} pathname={pathname} onNavigate={() => setIsNavOpen(false)} />
      </MobileDrawer>

      {showProfileTrigger ? (
        <MobileDrawer
          side="right"
          open={isProfileOpen}
          label={profileLabel}
          onClose={() => setIsProfileOpen(false)}
        >
          <DrawerLinks
            items={profileItems}
            pathname={pathname}
            onNavigate={() => setIsProfileOpen(false)}
          />
        </MobileDrawer>
      ) : null}
    </>
  );
}

