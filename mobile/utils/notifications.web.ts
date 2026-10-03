// utils/notifications.web.ts – Web stub (expo-notifications not supported on web)
export async function registerForPushNotifications(_token: string | null): Promise<string | null> {
  return null;
}

export async function getNotificationHistory(_token: string): Promise<any[]> {
  return [];
}

export async function markNotificationRead(_id: string, _token: string): Promise<void> {}
