export default function ConfirmDialog({
  open,
  title = "Please confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="confirm-title">{title}</h3>
        <p id="confirm-message" className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button type="button" className="confirm-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="confirm-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
