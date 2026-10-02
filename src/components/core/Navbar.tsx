'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from './Button';

export interface NavbarProps {
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: 'CUSTOMER' | 'STAFF' | 'TENANT_ADMIN';
  } | null;
  unreadNotificationsCount?: number;
  onSignOut?: () => void;
}

export function Navbar({ user, unreadNotificationsCount: initialUnread = 0, onSignOut }: NavbarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = React.useState(initialUnread);

  React.useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const handleLogout = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };

  let navLinks: { href: string; label: string }[] = [];
  if (user?.role === 'TENANT_ADMIN') {
    navLinks = [
      { href: '/admin', label: 'Operations & Analytics' },
      { href: '/admin#staff', label: 'Staff Roster' },
      { href: '/admin#outlets', label: 'Outlets & Chairs' },
    ];
  } else if (user?.role === 'STAFF') {
    navLinks = [
      { href: '/staff', label: 'Stylist Roster' },
      { href: '/appointments', label: 'Appointments' },
    ];
  } else {
    navLinks = [
      { href: '/', label: 'Explore Salons' },
      { href: '/appointments', label: 'My Appointments' },
    ];
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-neutral-950">
              Aura
            </span>
            <span className="hidden sm:inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Surat Marketplace
            </span>
          </Link>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-neutral-900',
                  isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-500'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification icon */}
              <Link
                href="/notifications"
                id="navbar-notifications-link"
                className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                )}
              </Link>

              {/* User Avatar + Profile Link */}
              <Link
                href="/profile"
                id="navbar-profile-link"
                className="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
                title="View & Edit Profile"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-neutral-900 leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-neutral-400 capitalize">
                    {user.role === 'TENANT_ADMIN' ? 'Salon Admin' : user.role.toLowerCase()}
                  </p>
                </div>
              </Link>

              {/* Sign Out Button */}
              <button
                id="navbar-signout-btn"
                onClick={handleLogout}
                className="rounded-md p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/register" className="hidden sm:inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-2">
                Create Account
              </Link>
              <Link href="/login">
                <Button size="sm" variant="primary">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
