import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { ars, fmtDate, fmtTime } from "@/lib/format";
import type { PublicEventList } from "@/lib/public.functions";

export function EventCard({ ev }: { ev: PublicEventList[number] }) {
  const cats = ev.ticket_categories ?? [];
  const active = cats.filter((c) => c.status === "activa");
  const min = active.length ? Math.min(...active.map((c) => Number(c.price))) : null;
  const available = cats.reduce((a, c) => a + (c.capacity - c.sold - c.reserved), 0);
  const soldOut = ev.status === "agotado" || (cats.length > 0 && available <= 0);
  return (
    <Link
      to="/eventos/$slug"
      params={{ slug: ev.slug }}
      className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        {ev.cover_url && (
          <img src={ev.cover_url} alt={ev.name} loading="lazy" width={1600} height={900}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-3 top-3 rounded-md bg-background/85 px-2.5 py-1 text-center backdrop-blur">
          <div className="text-[10px] font-semibold uppercase text-primary">{fmtDate(ev.starts_at, { weekday: undefined, day: undefined, year: undefined })}</div>
          <div className="font-display text-xl font-bold leading-none">{fmtDate(ev.starts_at, { weekday: undefined, month: undefined, year: undefined })}</div>
        </div>
        {soldOut && <span className="absolute right-3 top-3 rounded-md bg-destructive px-2 py-1 text-xs font-bold">AGOTADO</span>}
        {!soldOut && ev.sales_paused && <span className="absolute right-3 top-3 rounded-md bg-warning px-2 py-1 text-xs font-bold text-warning-foreground">VENTA PAUSADA</span>}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-lg font-bold leading-tight">{ev.name}</h3>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {fmtDate(ev.starts_at)} · {fmtTime(ev.starts_at)} h</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {ev.venue} · {ev.city}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">{min !== null ? <>Desde <b className="text-foreground">{ars(min)}</b></> : "Próximamente"}</span>
          <span className="text-sm font-semibold text-primary group-hover:underline">Ver entradas →</span>
        </div>
      </div>
    </Link>
  );
}
