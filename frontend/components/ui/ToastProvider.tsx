"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" };

const ToastContext = createContext<{
  addToast: (message: string, type?: "success" | "error") => void;
} | null>(null);

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const to = timers.current[id];
    if (to) {
      clearTimeout(to);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setToasts((t) => [...t, { id, message, type }]);
    const to = window.setTimeout(() => remove(id), 4000);
    timers.current[id] = to;
  }, [remove]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => {
              const to = timers.current[t.id];
              if (to) clearTimeout(to);
            }}
            onMouseLeave={() => {
              const to = window.setTimeout(() => remove(t.id), 3000);
              timers.current[t.id] = to;
            }}
            onClick={() => remove(t.id)}
            role="status"
            className={`cursor-pointer transform-gpu rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-200 ease-in-out ${
              t.type === "error" ? "bg-red-600 text-white" : "bg-brand-600 text-white"
            }`}
            style={{ willChange: "transform, opacity" }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
