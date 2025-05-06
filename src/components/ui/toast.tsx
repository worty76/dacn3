import { useToast } from "./use-toast";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { X } from "lucide-react";
import { Button } from "./button";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.variant === "destructive" ? "destructive" : "default"}
          className="animate-slide-in-right"
        >
          <div className="flex justify-between w-full">
            <div className="space-y-1">
              {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
              <AlertDescription>{toast.description}</AlertDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => dismiss(toast.id)}
            >
              <X size={16} />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
