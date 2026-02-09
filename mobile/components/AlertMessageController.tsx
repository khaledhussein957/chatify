import React, { createContext, useRef, useContext } from "react";
import AlertMessage, { AlertMessageHandles } from "./AlertMessage";
import AlertConfirm, { AlertConfirmHandles } from "./AlertConfirm";

type AlertContextType = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  hide: () => void;
  confirm: (
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; confirmColor?: string },
  ) => void;
  show: (msg: string) => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const alertRef = useRef<AlertMessageHandles>(null);
  const confirmRef = useRef<AlertConfirmHandles>(null);

  const contextValue: AlertContextType = {
    success: (msg) => alertRef.current?.show(msg, "success"),
    error: (msg) => alertRef.current?.show(msg, "error"),
    hide: () => alertRef.current?.hide(),
    confirm: (msg, onConfirm, options) =>
      confirmRef.current?.show(msg, onConfirm, options),
    show: (msg) => alertRef.current?.show(msg, "info"),
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <AlertMessage ref={alertRef} />
      <AlertConfirm ref={confirmRef} />
    </AlertContext.Provider>
  );
};

// Hook to access the alert anywhere
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};
