'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Badge, Tabs } from '@/components/core';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Calendar, 
  Check, 
  Loader2,
  ExternalLink 
} from 'lucide-react';

interface NotificationItem {
  id: string;
  tenantId: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: 'BOOKING_CONFIRMED' | 'STATUS_UPDATED' | 'APPOINTMENT_CANCELLED' | 'RESCHEDULE_NEEDED' | 'STAFF_PROVISIONED';
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('all');

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'APPOINTMENT_CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'STATUS_UPDATED':
      case 'RESCHEDULE_NEEDED':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'STAFF_PROVISIONED':
        return <UserCheck className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-600" />;
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.isRead;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Tab Filters */}
        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: 'all', label: 'All Notifications', badge: notifications.length },
            { id: 'unread', label: 'Unread', badge: unreadCount },
          ]}
        />

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-semibold text-neutral-800">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                You will be notified about booking confirmations, status updates, and schedule changes.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`relative flex items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                  item.isRead
                    ? 'border-neutral-200 bg-white'
                    : 'border-neutral-300 bg-neutral-50/60 shadow-xs ring-1 ring-neutral-200/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0 rounded-lg bg-neutral-100 p-2">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400">
                      <span>{new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      {item.entityId && (
                        <Link
                          href={`/appointments/${item.entityId}`}
                          className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 hover:underline"
                        >
                          View Appointment Pass
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="shrink-0 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
