'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Bell, LogOut, User, Scissors, Shield } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = React.useState(user);
  const [unreadCount, setUnreadCount] = React.useState(initialUnread);

  // Sync client-side session on route changes or mount
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Fetch unread notifications count
  React.useEffect(() => {
    if (currentUser) {
      fetch('/api/notifications')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, pathname]);

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

  // Determine effective operational role
  const isStaffRoute = pathname.startsWith('/staff');
  const isAdminRoute = pathname.startsWith('/admin');

  let effectiveRole = currentUser?.role;
  if (!effectiveRole) {
    if (isStaffRoute) effectiveRole = 'STAFF';
    else if (isAdminRoute) effectiveRole = 'TENANT_ADMIN';
    else effectiveRole = 'CUSTOMER';
  }

  // Brand Logo URL
  const homeHref = effectiveRole === 'STAFF' ? '/staff' : effectiveRole === 'TENANT_ADMIN' ? '/admin' : '/';

  // Navigation Links strictly tailored to User Journey
  let navLinks: { href: string; label: string }[] = [];
  if (effectiveRole === 'STAFF' || isStaffRoute) {
    navLinks = [
      { href: '/staff', label: 'Stylist Daily Roster' },
      { href: '/appointments', label: 'Appointments Queue' },
    ];
  } else if (effectiveRole === 'TENANT_ADMIN' || isAdminRoute) {
    navLinks = [
      { href: '/admin', label: 'Operations & Analytics' },
      { href: '/admin#staff', label: 'Staff Roster' },
      { href: '/admin#outlets', label: 'Outlets & Chairs' },
      { href: '/appointments', label: 'Master Bookings' },
    ];
  } else {
    // End Customers
    navLinks = [
      { href: '/', label: 'Explore Salons' },
      { href: '/appointments', label: 'My Appointments' },
    ];
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href={homeHref} className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-neutral-950">
              Aura
            </span>
            {effectiveRole === 'STAFF' ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <Scissors className="h-3 w-3" /> Stylist Terminal
              </span>
            ) : effectiveRole === 'TENANT_ADMIN' ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-[11px] font-bold text-white">
                <Shield className="h-3 w-3" /> Salon Admin
              </span>
            ) : (
              <span className="hidden sm:inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                Surat Marketplace
              </span>
            )}
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
          {currentUser ? (
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
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Link */}
              <Link
                href="/profile"
                id="navbar-profile-btn"
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors shadow-2xs"
              >
                <User className="h-3.5 w-3.5 text-neutral-500" />
                <span className="max-w-[120px] truncate">
                  {currentUser.fullName || currentUser.email.split('@')[0]}
                </span>
              </Link>

              {/* Sign Out Button */}
              <button
                type="button"
                id="navbar-signout-btn"
                onClick={handleLogout}
                className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
