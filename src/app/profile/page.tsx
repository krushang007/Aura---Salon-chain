'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, StatusBadge } from '@/components/core';
import { User, Mail, Phone, ShieldCheck, LogOut, CheckCircle2, AlertCircle, Loader2, Calendar } from 'lucide-react';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'STAFF' | 'TENANT_ADMIN';
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setProfile(data.user);
      setFullName(data.user.fullName || '');
      setPhone(data.user.phone || '');
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load profile details' });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update profile' });
        setIsSaving(false);
        return;
      }

      setFeedback({ type: 'success', message: 'Profile information updated successfully' });
      setProfile(data.user);
    } catch {
      setFeedback({ type: 'error', message: 'Network error while updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-neutral-50/40 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 font-display text-2xl font-bold text-white shadow-xs">
              {profile.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  {profile.fullName}
                </h1>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 capitalize">
                  {profile.role === 'TENANT_ADMIN' ? 'Salon Admin' : profile.role === 'CUSTOMER' ? 'Customer' : 'Staff'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{profile.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4 text-red-500" />}
            className="self-start sm:self-auto text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
          >
            Sign Out
          </Button>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="font-display text-lg font-bold text-neutral-900">
              Personal Information
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Update your name and primary contact details for salon desk booking confirmations.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="flex h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Primary login email cannot be changed directly. Contact support for assistance.
              </p>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98250 12345"
            />

            <div className="flex items-center justify-between border-t border-neutral-100 pt-5">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Session Actions */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-sm font-bold text-neutral-900">
                Active Session
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                You are currently signed in on this device. Sign out anytime to clear local session tokens.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-neutral-700 hover:text-red-600"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
