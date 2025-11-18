import { PermissionsAndroid, Platform } from "react-native";

import { Notifications } from "react-native-notifications";

class NotificationService {
  configure = async () => {
    try {
      if (Platform.OS === "ios") {
        Notifications.registerRemoteNotifications();
      }

      Notifications.events().registerRemoteNotificationsRegistered((event) => {
        console.log("TOKEN:", event.deviceToken);
      });
      Notifications.events().registerRemoteNotificationsRegistrationFailed(
        (event) => {
          console.error(event);
        }
      );
      Notifications.events().registerNotificationReceivedForeground(
        (notification, completion) => {
          console.log("NOTIFICATION:", notification);
          try {
            completion &&
              completion({ alert: false, sound: false, badge: false });
          } catch {}
        }
      );
      Notifications.events().registerNotificationOpened(
        (notification, completion) => {
          console.log("NOTIFICATION:", notification);
          try {
            completion && completion();
          } catch {}
        }
      );

      if (Platform.OS === "android") {
        try {
          if (Platform.Version >= 33 && PermissionsAndroid?.request) {
            const hasPerm = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            console.warn("POST_NOTIFICATIONS hasPerm:", hasPerm);

            if (!hasPerm) {
              const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
              );
              console.warn("POST_NOTIFICATIONS request result:", result);
            } else {
              console.warn("POST_NOTIFICATIONS already granted");
            }
          }
          // Create notification channel if supported by the native module
          if (
            Notifications &&
            typeof Notifications.setNotificationChannel === "function"
          ) {
            Notifications.setNotificationChannel({
              channelId: "task-reminder-channel",
              name: "Task Reminders",
              description: "Notifications for task reminders",
              importance: 5,
            });
          } else {
            console.warn(
              "setNotificationChannel is not available on this build"
            );
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  scheduleNotification = (task) => {
    try {
      const { id, title, description, reminderTime, reminderType } = task;

      // Cancel existing notifications for this task
      Notifications.cancelLocalNotification(Number(id));

      const reminderDate = new Date(reminderTime);
      const now = new Date();

      // If the reminder time is in the past, adjust it
      if (reminderDate < now) {
        reminderDate.setDate(now.getDate() + 1);
      }

      const notification = {
        title: `Task Reminder: ${title}`,
        body: description || "Don't forget to complete this task!",
        userInfo: { id: Number(id), reminderType: reminderType || null },
      };

      if (Platform.OS === "ios") {
        notification.fireDate = reminderDate.toISOString();
      }

      Notifications.postLocalNotification(notification, Number(id));
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

  cancelNotification = (taskId) => {
    try {
      Notifications.cancelLocalNotification(Number(taskId));
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  cancelAllNotifications = () => {
    try {
      if (Platform.OS === "ios") {
        Notifications.ios.cancelAllLocalNotifications();
      }
      Notifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  };

  checkPermissions = (callback) => {
    try {
      if (Platform.OS === "ios") {
        Notifications.ios
          .checkPermissions()
          .then((settings) => {
            if (typeof callback === "function") callback(settings);
          })
          .catch(() => {
            if (typeof callback === "function") callback({});
          });
      } else {
        if (typeof callback === "function") {
          callback({ alert: true, badge: true, sound: true });
        }
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  requestPermissions = () => {
    try {
      if (Platform.OS === "ios") {
        Notifications.registerRemoteNotifications();
      } else if (Platform.OS === "android" && Platform.Version >= 33) {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        ).catch(() => {});
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  // Send immediate notification for testing
  sendTestNotification = (title, message) => {
    try {
      Notifications.postLocalNotification({
        title: title || "Test Notification",
        body: message || "This is a test notification",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };
}

export default new NotificationService();
