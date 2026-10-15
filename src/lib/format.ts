export const TZ = "America/Argentina/San_Juan";

export function ars(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

/** Convert ISO to value for <input type="datetime-local"> in San Juan time (UTC-3, no DST). */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
export function fromLocalInput(v: string) {
  if (!v) return null;
  return new Date(v + ":00-03:00").toISOString();
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const EVENT_STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador", en_revision: "En revisión", programado: "Programado", publicado: "Publicado",
  venta_activa: "Venta activa", pausado: "Pausado", agotado: "Agotado", finalizado: "Finalizado",
  suspendido: "Suspendido", cancelado: "Cancelado", archivado: "Archivado",
};
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente", procesando: "Procesando", pagada: "Pagada", fallida: "Fallida",
  expirada: "Expirada", reembolsada_parcial: "Reembolsada parcial", reembolsada: "Reembolsada",
};
export const TICKET_STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente", valida: "Válida", utilizada: "Utilizada", anulada: "Anulada",
  reembolsada: "Reembolsada", bloqueada: "Bloqueada", transferida: "Transferida",
};

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
