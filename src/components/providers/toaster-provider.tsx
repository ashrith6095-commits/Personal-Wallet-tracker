"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      }}
    />
  );
}
