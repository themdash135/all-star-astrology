import { Capacitor } from '@capacitor/core';

let permissionRequested = false;

export async function notifyResolvedFeedback(resolvedTickets) {
  if (!Array.isArray(resolvedTickets) || resolvedTickets.length === 0) {
    return false;
  }

  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    if (!permissionRequested) {
      permissionRequested = true;
      await LocalNotifications.requestPermissions();
    }

    const baseTime = Date.now() + 1000;
    await LocalNotifications.schedule({
      notifications: resolvedTickets.map((ticket, index) => ({
        id: baseTime + index,
        title: 'Feedback update',
        body: `Your ${ticket.category || 'feedback'} report was marked fixed. Open All Star Astrology to see the admin reply.`,
        schedule: { at: new Date(baseTime + index * 1000) },
        extra: {
          ticketId: ticket.id,
          responseId: ticket.latestResponse?.id || '',
        },
      })),
    });
    return true;
  } catch {
    return false;
  }
}
