const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Today as yyyy-mm-dd in the app timezone (Vietnam). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "2026-06-12" → "12/06". */
export function shortDateVi(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

/** "2026-06-12" → "Thứ Sáu, 12/06". */
export function longDateVi(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(date);
  return `${weekday}, ${shortDateVi(iso)}`;
}
