 import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

class NotificationService {
  configure = async () => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === "android") {
        // Create notification channel if supported by the native module
        await Notifications.setNotificationChannelAsync(
          "task-reminder-channel",
          {
            name: "Task Reminders",
            importance: Notifications.AndroidImportance.HIGH,
            description: "Notifications for task reminders",
            sound: "default",
          }
        );
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  scheduleNotification = async (task) => {
    try {
      const { id, title, description, reminderTime, reminderType } = task;

      // Cancel existing notifications for this task
      await this.cancelNotification(String(id));

      const reminderDate = new Date(reminderTime);
      const now = new Date();

      const content = {
        title: `Task Reminder: ${title}`,
        body: description || "Don't forget to complete this task!",
        data: { id: Number(id), reminderType: reminderType || null },
        sound: "default",
        ...(Platform.OS === "android"
          ? {
              channelId: "task-reminder-channel",
              priority: Notifications.AndroidNotificationPriority.HIGH,
            }
          : {}),
      };

      // Always compute next occurrence and use a DATE trigger to avoid immediate firing
      const nextDate = this._computeNextOccurrence(reminderType, reminderDate, now);
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDate,
      };

      const msUntil = nextDate.getTime() - now.getTime();
      try {
        console.warn("[notifications] schedule", {
          taskId: String(id),
          reminderType,
          now: now.toISOString(),
          reminderTime,
          nextDate: nextDate.toISOString(),
          msUntil,
        });
      } catch {}

      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      await this._saveTaskNotificationId(String(id), identifier);
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  getRepeatType = (reminderType) => {
    switch (reminderType) {
      case "daily":
        return "day";
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return null;
    }
  };

  cancelNotification = async (taskId) => {
    try {
      const id = await this._getTaskNotificationId(String(taskId));
      if (id) {
        await Notifications.cancelScheduledNotificationAsync(id);
        await this._removeTaskNotificationId(String(taskId));
      }
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await AsyncStorage.removeItem("@task_notification_ids");
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  };

  checkPermissions = (callback) => {
    try {
      Notifications.getPermissionsAsync()
        .then((perm) => {
          if (typeof callback === "function") {
            const granted = perm.status === "granted";
            callback({ alert: granted, badge: granted, sound: granted });
          }
        })
        .catch(() => {
          if (typeof callback === "function") callback({});
        });
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  requestPermissions = () => {
    try {
      Notifications.requestPermissionsAsync().catch(() => {});
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  // Send immediate notification for testing
  sendTestNotification = (title, message) => {
    try {
      Notifications.scheduleNotificationAsync({
        content: {
          title: title || "Test Notification",
          body: message || "This is a test notification",
          sound: "default",
          ...(Platform.OS === "android"
            ? { channelId: "task-reminder-channel" }
            : {}),
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };

  _mapKey = "@task_notification_ids";

  _loadMap = async () => {
    try {
      const json = await AsyncStorage.getItem(this._mapKey);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  };

  _saveMap = async (map) => {
    try {
      await AsyncStorage.setItem(this._mapKey, JSON.stringify(map));
    } catch {}
  };

  _saveTaskNotificationId = async (taskId, identifier) => {
    const map = await this._loadMap();
    map[taskId] = identifier;
    await this._saveMap(map);
  };

  _getTaskNotificationId = async (taskId) => {
    const map = await this._loadMap();
    return map[taskId] || null;
  };

  _removeTaskNotificationId = async (taskId) => {
    const map = await this._loadMap();
    if (map[taskId]) {
      delete map[taskId];
      await this._saveMap(map);
    }
  };

  _computeNextOccurrence = (reminderType, baseDate, now) => {
    const d = new Date(baseDate);
    d.setSeconds(0, 0);
    if (reminderType === "daily") {
      if (d <= now) d.setDate(d.getDate() + 1);
      return d;
    }
    if (reminderType === "weekly") {
      // getDay(): 0=Sun..6=Sat; schedule on same weekday/time next occurrence
      const desired = d.getDay();
      const cur = now.getDay();
      let diff = desired - cur;
      if (diff < 0) diff += 7;
      const next = new Date(now);
      next.setHours(d.getHours(), d.getMinutes(), 0, 0);
      if (diff === 0 && next <= now) diff = 7;
      next.setDate(now.getDate() + diff);
      return next;
    }
    if (reminderType === "monthly") {
      const next = new Date(now);
      next.setHours(d.getHours(), d.getMinutes(), 0, 0);
      // If day has not yet come this month, use this month; else next month
      const targetDay = d.getDate();
      if (
        now.getDate() < targetDay ||
        (now.getDate() === targetDay && next > now)
      ) {
        next.setDate(targetDay);
      } else {
        // Move to next month, then set date
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDay);
      }
      return next;
    }
    // default fallback
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  };
}

export default new NotificationService();
