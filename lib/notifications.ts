import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Store notification response handler and subscription
type NotificationResponse = {
  notification: {
    request: {
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
};

type Notification = {
  request: {
    content: {
      data?: Record<string, unknown>;
    };
  };
};

type Subscription = { remove: () => void };

// Canonical Expo Go detection for SDK 53+: "storeClient" only in Expo Go, never in a real build
const isExpoGo = Constants.executionEnvironment === "storeClient";

let notificationsModulePromise: Promise<
  typeof import("expo-notifications") | null
> | null = null;
let notificationHandlerConfigured = false;

async function getNotificationsModule(): Promise<
  typeof import("expo-notifications") | null
> {
  if (isExpoGo) {
    return null;
  }
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }
  return notificationsModulePromise;
}

async function ensureNotificationHandler() {
  const Notifications = await getNotificationsModule();
  if (!Notifications || notificationHandlerConfigured) {
    return Notifications;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Create the Android channel early — must exist before any notification is scheduled
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("irrigation-reminders", {
      name: "Irrigation Schedule Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
    });
  }

  notificationHandlerConfigured = true;
  return Notifications;
}

let notificationResponseHandlers = new Set<
  (response: NotificationResponse) => void
>();
let notificationReceivedHandlers = new Set<
  (notification: Notification) => void
>();
let notificationResponseSubscription: Subscription | null = null;
let notificationReceivedSubscription: Subscription | null = null;

function dispatchNotificationResponse(response: NotificationResponse) {
  notificationResponseHandlers.forEach((handler) => {
    try {
      handler(response);
    } catch (error) {
      console.error("[notifications] response handler failed:", error);
    }
  });
}

function dispatchNotificationReceived(notification: Notification) {
  notificationReceivedHandlers.forEach((handler) => {
    try {
      handler(notification);
    } catch (error) {
      console.error("[notifications] received handler failed:", error);
    }
  });
}

async function ensureNotificationResponseListener() {
  if (isExpoGo) return;
  const Notifications = await ensureNotificationHandler();
  if (!Notifications || notificationResponseSubscription) return;

  notificationResponseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      dispatchNotificationResponse(response as NotificationResponse);
    }) as Subscription;

  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    dispatchNotificationResponse(response as NotificationResponse);
  }
}

async function ensureNotificationReceivedListener() {
  if (isExpoGo) return;
  const Notifications = await ensureNotificationHandler();
  if (!Notifications || notificationReceivedSubscription) return;

  notificationReceivedSubscription =
    Notifications.addNotificationReceivedListener((notification) => {
      dispatchNotificationReceived(notification as Notification);
    }) as Subscription;
}

export function addNotificationResponseHandler(
  handler: (response: NotificationResponse) => void,
): () => void {
  notificationResponseHandlers.add(handler);
  void ensureNotificationResponseListener();
  return () => {
    notificationResponseHandlers.delete(handler);
  };
}

export function addNotificationReceivedHandler(
  handler: (notification: Notification) => void,
): () => void {
  notificationReceivedHandlers.add(handler);
  void ensureNotificationReceivedListener();
  return () => {
    notificationReceivedHandlers.delete(handler);
  };
}

/** @deprecated Prefer addNotificationResponseHandler for composable listeners. */
export function setNotificationResponseHandler(
  handler: (response: NotificationResponse) => void,
) {
  notificationResponseHandlers.clear();
  notificationResponseHandlers.add(handler);
  void ensureNotificationResponseListener();
}

/** @deprecated Prefer addNotificationReceivedHandler for composable listeners. */
export function setNotificationReceivedHandler(
  handler: (notification: Notification) => void,
) {
  notificationReceivedHandlers.clear();
  notificationReceivedHandlers.add(handler);
  void ensureNotificationReceivedListener();
}

// Remove notification response listener
export function removeNotificationResponseHandler() {
  notificationResponseHandlers.clear();
  if (notificationResponseSubscription) {
    notificationResponseSubscription.remove();
    notificationResponseSubscription = null;
  }
}

export function removeNotificationReceivedHandler() {
  notificationReceivedHandlers.clear();
  if (notificationReceivedSubscription) {
    notificationReceivedSubscription.remove();
    notificationReceivedSubscription = null;
  }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = await ensureNotificationHandler();
    if (!Notifications) {
      console.log(
        "expo-notifications is disabled in Expo Go. Use a development build for push notifications.",
      );
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push notification permissions!");
      return false;
    }

    // Channel is already created in ensureNotificationHandler() above

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const Notifications = await ensureNotificationHandler();
    if (!Notifications) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn(
        "[notifications] Missing EAS projectId for Expo push token.",
      );
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenResponse.data ?? null;
  } catch (error) {
    console.error("Error getting Expo push token:", error);
    return null;
  }
}

/** Philippines (PHT): UTC+8, no DST — irrigation times are interpreted as Manila civil time. */
const PHILIPPINES_OFFSET = "+08:00";

function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

/** Today's calendar date in Asia/Manila (not the device timezone). */
export function getPhilippinesTodayYmd(): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const n = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { year: n("year"), month: n("month"), day: n("day") };
}

/** Current clock in Asia/Manila (schedule times are PH civil time). */
export function getPhilippinesNowClock(): {
  year: number;
  month: number;
  day: number;
  minutesSinceMidnight: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const n = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  const hour = n("hour") % 24;
  const minute = n("minute");
  return {
    year: n("year"),
    month: n("month"),
    day: n("day"),
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/** &lt; 0 if before Manila today, 0 if today, &gt; 0 if after. */
export function philippinesCalendarCompare(
  year: number,
  month: number,
  day: number,
): number {
  const t = getPhilippinesTodayYmd();
  if (year !== t.year) return year - t.year;
  if (month !== t.month) return month - t.month;
  return day - t.day;
}

export function parseRemarkDateKey(
  dateKey?: string | null,
): { year: number; month: number; day: number } | null {
  if (!dateKey) return null;
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

/** True when the remark's calendar date is today or earlier in Asia/Manila. */
export function isAdminRemarkDue(dateKey?: string | null): boolean {
  const parsed = parseRemarkDateKey(dateKey);
  if (!parsed) return false;
  return philippinesCalendarCompare(parsed.year, parsed.month, parsed.day) <= 0;
}

function getPhilippinesDayStart(
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T00:00:00${PHILIPPINES_OFFSET}`,
  );
}

export async function scheduleAdminRemarkNotification(
  text: string,
  dateKey?: string | null,
): Promise<string | null> {
  const body = text.trim();
  if (!body) return null;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const Notifications = await ensureNotificationHandler();
    if (!Notifications) return null;

    const parsed = parseRemarkDateKey(dateKey);
    const now = new Date();
    let trigger:
      | { type: typeof Notifications.SchedulableTriggerInputTypes.DATE; date: Date }
      | {
          type: typeof Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL;
          seconds: number;
        };

    if (parsed) {
      const remarkDayStart = getPhilippinesDayStart(
        parsed.year,
        parsed.month,
        parsed.day,
      );
      if (remarkDayStart.getTime() > now.getTime()) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remarkDayStart,
        };
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        };
      }
    } else {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      };
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Admin Remark",
        body,
        sound: true,
        ...(Platform.OS === "android" && {
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: "irrigation-reminders",
        }),
        data: {
          type: "admin_remark",
          date_key: dateKey ?? null,
        },
      },
      trigger,
    });
  } catch (error) {
    console.error("Error scheduling admin remark notification:", error);
    return null;
  }
}

/** Deliver today's admin remark if the farmer has a schedule on that date. */
export async function syncTodayAdminRemarkNotifications(
  scheduleIds: string[],
): Promise<void> {
  if (scheduleIds.length === 0) return;

  const phToday = getPhilippinesTodayYmd();
  const todayKey = `${phToday.year}-${phToday.month}-${phToday.day}`;

  const { data: scheduledDate, error: dateError } = await supabase
    .from("irrigation_scheduled_dates")
    .select("id")
    .in("schedule_id", scheduleIds)
    .eq("year", phToday.year)
    .eq("month", phToday.month)
    .eq("day", phToday.day)
    .limit(1);

  if (dateError || !scheduledDate?.length) return;

  const { data: remark, error: remarkError } = await supabase
    .from("irrigation_remarks")
    .select("text")
    .eq("date_key", todayKey)
    .maybeSingle();

  if (remarkError || !remark?.text) return;

  await scheduleAdminRemarkNotification(String(remark.text), todayKey);
}

/**
 * Absolute instant when irrigation should fire: calendar (day, month, year) + time
 * interpreted as Philippines local time (ISO with +08:00). Same instant regardless of device TZ.
 */
export function getNotificationDate(
  timeString: string,
  day: number,
  month: number,
  year: number,
): Date {
  const trimmed = timeString.trim();
  if (!trimmed) {
    return new Date();
  }
  try {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    let hour = 0;
    let minute = 0;

    // 24h "14:30" or "09:05" — treated as Philippines civil time
    if (parts.length === 1 && /^\d{1,2}:\d{2}$/.test(parts[0])) {
      const [h, m] = parts[0].split(":").map((x) => parseInt(x, 10));
      hour = h;
      minute = m;
    } else if (parts.length >= 2) {
      const timePart = parts[0];
      const period = parts[1].toUpperCase();
      const [hourStr, minuteStr] = timePart.split(":");
      hour = parseInt(hourStr, 10);
      minute = parseInt(minuteStr ?? "0", 10);

      // AM / PM / NN (noon) — common in PH ("12:00 NN")
      if (period === "AM") {
        if (hour === 12) hour = 0;
      } else if (period === "PM" || period === "NN" || period === "NOON") {
        if (hour !== 12) hour += 12;
      }
    }

    const iso = `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00${PHILIPPINES_OFFSET}`;
    return new Date(iso);
  } catch (error) {
    console.error("Error parsing time string:", timeString, error);
  }
  return new Date();
}

// Schedule a notification for irrigation
export async function scheduleIrrigationNotification(
  scheduleId: string,
  day: number,
  month: number,
  year: number,
  time: string,
): Promise<string | null> {
  try {
    const Notifications = await ensureNotificationHandler();
    if (!Notifications) {
      console.warn(
        "[notifications] expo-notifications is not available (Expo Go disables it, or the native module failed to load). Use a development/production build to test scheduled alerts.",
      );
      return null;
    }

    const notificationDate = getNotificationDate(time, day, month, year);
    const now = new Date();

    if (notificationDate <= now) {
      console.log(
        "Notification time has already passed (vs device clock), skipping",
        time,
        `(PH ${day}/${month}/${year})`,
        notificationDate.toISOString(),
      );
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Irrigation Reminder",
        body: `Time to irrigate your crops! Scheduled for ${time}`,
        sound: true,
        ...(Platform.OS === "android" && {
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: "irrigation-reminders",
        }),
        data: {
          scheduleId,
          day,
          month,
          year,
          time,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    console.log(
      `Scheduled notification ${notificationId} for ${day}/${month}/${year} at ${time}`,
    );
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

// Cancel a specific notification
export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Cancelled all notifications");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications(): Promise<any[]> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return [];
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}

// Cancel notifications for a specific schedule
export async function cancelNotificationsForSchedule(
  scheduleId: string,
): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    const allNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of allNotifications) {
      if (notification.content.data?.scheduleId === scheduleId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }
    }

    console.log(`Cancelled notifications for schedule ${scheduleId}`);
  } catch (error) {
    console.error("Error cancelling notifications for schedule:", error);
  }
}

// Reschedule all notifications for a schedule
export async function rescheduleNotificationsForDates(
  dateSchedules: Map<
    string,
    {
      day: number;
      month: number;
      year: number;
      schedules: { id: string; time: string }[];
    }
  >,
  scheduleId: string,
): Promise<void> {
  try {
    // Cancel existing notifications for this schedule
    await cancelNotificationsForSchedule(scheduleId);

    // Schedule new notifications (calendar days vs Philippines "today", not device TZ)
    for (const [dateKey, dateSchedule] of dateSchedules.entries()) {
      if (
        philippinesCalendarCompare(
          dateSchedule.year,
          dateSchedule.month,
          dateSchedule.day,
        ) < 0
      ) {
        continue;
      }

      for (const schedule of dateSchedule.schedules) {
        if (schedule.time && schedule.time !== "Not set") {
          await scheduleIrrigationNotification(
            scheduleId,
            dateSchedule.day,
            dateSchedule.month,
            dateSchedule.year,
            schedule.time,
          );
        }
      }
    }

    console.log(
      "Rescheduled all notifications (Philippines / Asia/Manila times)",
    );
  } catch (error) {
    console.error("Error rescheduling notifications:", error);
  }
}
