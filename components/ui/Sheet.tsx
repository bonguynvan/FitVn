"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Sheet — mobile bottom-sheet modal for quick "add" forms. Overlay + slide-up
 * panel capped to max-w-app, scrollable body, Escape / overlay-tap to close,
 * and body-scroll lock while open.
 */
interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
      />
      <div className="animate-sheet-up relative z-10 w-full max-w-app rounded-t-[1.5rem] border border-border bg-surface pb-safe shadow-raised">
        <span
          aria-hidden
          className="mx-auto mt-2.5 block h-1.5 w-10 rounded-pill bg-border"
        />
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 pb-4 pt-3">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
