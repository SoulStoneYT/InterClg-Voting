import { useCallback, useMemo, useState } from "react";
import Notification from "../components/Notification";
import NotificationContext from "./notificationContext";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback((message, type = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      window.setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const value = useMemo(() => ({
    showNotification,
    removeNotification,
    notifications
  }), [showNotification, removeNotification, notifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification notifications={notifications} onClose={removeNotification} />
    </NotificationContext.Provider>
  );
}