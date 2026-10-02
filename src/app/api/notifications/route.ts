import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, notificationUpdateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.recipientUserId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // M-3: Zod validation
    const validation = await validateRequestBody(request, notificationUpdateSchema);
    if ('error' in validation) return validation.error;
    const { notificationId, markAllAsRead } = validation.data;

    if (markAllAsRead) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.recipientUserId, user.id));

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // H-3: Ownership check — only mark your own notifications as read
      const [updated] = await db.update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.recipientUserId, user.id)
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json({ error: 'Notification not found or not yours' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'notificationId or markAllAsRead is required' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
