"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Download, Trash2, Upload } from "lucide-react";

import { SectionHeader } from "@/components/ui";
import { clearAllData, downloadBackup, importBackup } from "@/lib/store/backup";

type Message = { tone: "success" | "danger"; text: string };

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    const text = await file.text();
    const res = importBackup(text);
    if (res.ok) {
      setMessage({ tone: "success", text: "Đã nhập dữ liệu. Đang tải lại…" });
      setTimeout(() => window.location.reload(), 800);
    } else {
      setMessage({ tone: "danger", text: res.error ?? "Nhập thất bại." });
    }
  }

  function onClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAllData();
    setMessage({ tone: "success", text: "Đã xóa toàn bộ dữ liệu. Đang tải lại…" });
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader>Dữ liệu</SectionHeader>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={downloadBackup}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-text transition-colors hover:border-primary/50 active:scale-[0.98]"
        >
          <Download size={16} aria-hidden /> Xuất
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-text transition-colors hover:border-primary/50 active:scale-[0.98]"
        >
          <Upload size={16} aria-hidden /> Nhập
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFile}
      />

      <button
        type="button"
        onClick={onClear}
        onBlur={() => setConfirmClear(false)}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-btn border text-sm font-semibold transition-colors active:scale-[0.98] ${
          confirmClear
            ? "border-danger bg-danger/10 text-danger"
            : "border-border bg-surface text-danger hover:border-danger/40"
        }`}
      >
        {confirmClear ? (
          <>
            <AlertTriangle size={16} aria-hidden /> Nhấn lần nữa để xác nhận xóa
          </>
        ) : (
          <>
            <Trash2 size={16} aria-hidden /> Xóa toàn bộ dữ liệu
          </>
        )}
      </button>

      {message ? (
        <p
          role="status"
          className={`rounded-btn px-3 py-2 text-sm ${
            message.tone === "success"
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        Dữ liệu được lưu trên thiết bị này. Hãy xuất tệp sao lưu định kỳ để tránh
        mất dữ liệu.
      </p>
    </section>
  );
}
