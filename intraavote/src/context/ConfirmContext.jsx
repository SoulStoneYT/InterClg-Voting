import { useCallback, useMemo, useRef, useState } from "react";
import ConfirmContext from "./confirmContext";
import ConfirmDialog from "../components/ConfirmDialog";

export function ConfirmProvider({ children }) {
  const resolverRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "Please confirm",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel"
  });

  const closeWithResult = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }

    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        title: options.title || "Please confirm",
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel"
      });
    });
  }, []);

  const value = useMemo(() => ({ showConfirm }), [showConfirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={() => closeWithResult(true)}
        onCancel={() => closeWithResult(false)}
      />
    </ConfirmContext.Provider>
  );
}
