'use client';

import { useEffect } from 'react';

interface Props {
  side: 'left' | 'right';
  open: boolean;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileDrawer({ side, open, label, onClose, children }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  return (
    <div
      className={`mobile-drawer-shell ${open ? 'mobile-drawer-shell-open' : ''}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="mobile-drawer-overlay"
        aria-label={`Close ${label}`}
        onClick={onClose}
      />
      <aside
        className={`mobile-drawer mobile-drawer-${side} ${open ? 'mobile-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-title">{label}</span>
          <button
            type="button"
            className="mobile-drawer-close"
            aria-label={`Close ${label}`}
            onClick={onClose}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div className="mobile-drawer-content">{children}</div>
      </aside>
    </div>
  );
}

