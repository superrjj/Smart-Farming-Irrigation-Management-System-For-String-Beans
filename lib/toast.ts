export type ToastVariant = "success" | "error" | "info";

export type ToastPayload = {
  message: string;
  variant?: ToastVariant;
};

type ToastListener = (payload: ToastPayload) => void;

let listener: ToastListener | null = null;

export function registerToastListener(fn: ToastListener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

let lastToastMessage = "";
let lastToastAt = 0;

export function showToast(
  message: string,
  variant: ToastVariant = "info",
): void {
  const now = Date.now();
  if (message === lastToastMessage && now - lastToastAt < 2500) return;
  lastToastMessage = message;
  lastToastAt = now;
  listener?.({ message, variant });
}
