import { useState } from "react";

type ToastVariant = "default" | "destructive";

type ToastProps = {
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
};

type Toast = {
  id: string;
} & ToastProps;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({
    title,
    description,
    variant = "default",
    duration = 5000,
  }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, duration };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);

    return id;
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts((prevToasts) =>
        prevToasts.filter((toast) => toast.id !== toastId)
      );
    } else {
      setToasts([]);
    }
  };

  return {
    toast,
    dismiss,
    toasts,
  };
}
