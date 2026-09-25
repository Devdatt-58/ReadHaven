'use client';

import { useState } from 'react';
import MobileDrawer from './MobileDrawer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNavItem } from './mobile-nav';

interface Props {
  navItems: MobileNavItem[];
  profileLabel: string;
  profilePanel: React.ReactNode;
  communityPanel: React.ReactNode;
}

function HomeMobileNav({
  items,
  pathname,
  onNavigate,
}: {
  items: MobileNavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="mobile-drawer-nav" aria-label="Home navigation">
      {items.map((item) => {
        const isActive =
          item.matchMode === 'exact'
            ? pathname === item.href
            : item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <i className={item.icon} aria-hidden="true"></i>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function HomeMobileChrome({
  navItems,
  profileLabel,
  profilePanel,
  communityPanel,
}: Props) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <div className="home-mobile-chrome">
        <button
          type="button"
          className="mobile-topbar-icon"
          aria-label="Open navigation menu"
          onClick={() => setIsNavOpen(true)}
        >
          <i className="fas fa-bars" aria-hidden="true"></i>
        </button>

        <Link href="/" className="home-mobile-brand">
          ReadHaven
        </Link>

        <button
          type="button"
          className="mobile-topbar-icon"
          aria-label={`Open ${profileLabel}`}
          onClick={() => setIsProfileOpen(true)}
        >
          <i className="fas fa-user-circle" aria-hidden="true"></i>
        </button>
      </div>

      <MobileDrawer side="left" open={isNavOpen} label="Home navigation" onClose={() => setIsNavOpen(false)}>
        <HomeMobileNav items={navItems} pathname={pathname} onNavigate={() => setIsNavOpen(false)} />
      </MobileDrawer>

      <MobileDrawer side="right" open={isProfileOpen} label={profileLabel} onClose={() => setIsProfileOpen(false)}>
        <div className="home-mobile-panel-stack">
          {profilePanel}
          {communityPanel}
        </div>
      </MobileDrawer>
    </>
  );
}
