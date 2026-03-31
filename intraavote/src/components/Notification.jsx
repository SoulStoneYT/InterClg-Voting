export default function Notification({ notifications, onClose }) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-item notification-item--${notification.type}`}
        >
          <p className="notification-message">{notification.message}</p>
          <button
            type="button"
            className="notification-close"
            onClick={() => onClose(notification.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
