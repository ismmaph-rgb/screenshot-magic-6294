import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Minus, Plus, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getPublicEvent } from "@/lib/public.functions";
import { ars, fmtDate, fmtTime } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const eventQuery = (slug: string) =>
  queryOptions({ queryKey: ["public-event", slug], queryFn: () => getPublicEvent({ data: { slug } }) });

export const Route = createFileRoute("/eventos/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  loader: async ({ context, params }) => {
    const ev = await context.queryClient.ensureQueryData(eventQuery(params.slug));
    if (!ev) throw notFound();
    return ev;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Entradas | EGRESANTOS` },
          { name: "description", content: loaderData.short_description ?? `Entradas para ${loaderData.name}` },
          { property: "og:title", content: `${loaderData.name} — EGRESANTOS` },
          { property: "og:description", content: loaderData.short_description ?? `Entradas para ${loaderData.name}` },
        ]
      : [{ title: "Evento no disponible — EGRESANTOS" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Evento no disponible</h1>
        <p className="mt-2 text-muted-foreground">Puede que haya finalizado o que todavía no esté publicado.</p>
        <Button asChild className="mt-6" variant="brand"><Link to="/eventos">Ver eventos</Link></Button>
      </div>
    </PublicLayout>
  ),
  component: EventPage,
});

function EventPage() {
  const { slug } = Route.useParams();
  const { ref } = Route.useSearch();
  const { data: ev } = useSuspenseQuery(eventQuery(slug));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", dni: "" });
  const [rrpp, setRrpp] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref) setRrpp(ref);
    else {
      const stored = window.localStorage.getItem("egr_ref");
      if (stored) setRrpp(stored);
    }
    if (ref) window.localStorage.setItem("egr_ref", ref);
  }, [ref]);
  useEffect(() => {
    if (user) setBuyer((b) => ({ ...b, email: b.email || user.email || "", name: b.name || (user.user_metadata?.full_name ?? "") }));
  }, [user]);

  if (!ev) return null;
  const cats = [...(ev.ticket_categories ?? [])].filter((c) => c.status !== "oculta").sort((a, b) => a.sort_order - b.sort_order);
  const canBuy = (ev.status === "publicado" || ev.status === "venta_activa") && !ev.sales_paused;
  const now = Date.now();

  const subtotal = useMemo(() => cats.reduce((a, c) => a + Number(c.price) * (qty[c.id] ?? 0), 0), [cats, qty]);
  const fee = Math.round(subtotal * Number(ev.service_fee_pct)) / 100;
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  async function checkout() {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/eventos/${slug}` } });
      return;
    }
    if (!terms) return toast.error("Tenés que aceptar los términos y condiciones");
    setBusy(true);
    const items = Object.entries(qty).filter(([, q]) => q > 0).map(([category_id, quantity]) => ({ category_id, quantity }));
    const { data, error } = await supabase.rpc("create_order", {
      p_event_id: ev!.id, p_items: items, p_buyer: buyer, p_rrpp_code: rrpp || undefined,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/orden/$id", params: { id: data as string } });
  }

  return (
    <PublicLayout>
      <div className="relative h-[42vh] min-h-72 overflow-hidden">
        {ev.cover_url && <img src={ev.cover_url} alt={ev.name} className="h-full w-full object-cover" width={1600} height={900} />}
        <div className="absolute inset-0 bg-fade" />
      </div>
      <div className="relative mx-auto -mt-32 grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{ev.organizer_name}</p>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{ev.name}</h1>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {fmtDate(ev.starts_at, { weekday: "long" })} · {fmtTime(ev.starts_at)} h</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {ev.venue}{ev.address ? ` · ${ev.address}` : ""} · {ev.city}, {ev.province}</span>
              {ev.age_min && <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> +{ev.age_min} años</span>}
            </div>
          </div>
          {ev.description && <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{ev.description}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {ev.entry_conditions && <InfoBox title="Condiciones de ingreso" text={ev.entry_conditions} />}
            {ev.refund_policy && <InfoBox title="Política de devolución" text={ev.refund_policy} />}
          </div>
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="text-xl font-bold">Entradas</h2>
          {!canBuy && (
            <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              <ShieldAlert className="h-4 w-4 shrink-0" /> La venta no está habilitada en este momento.
            </div>
          )}
          <div className="space-y-3">
            {cats.map((c) => {
              const avail = c.capacity - c.sold - c.reserved;
              const notStarted = c.sale_start && new Date(c.sale_start).getTime() > now;
              const ended = c.sale_end && new Date(c.sale_end).getTime() < now;
              const disabled = !canBuy || c.status !== "activa" || avail <= 0 || !!notStarted || !!ended;
              const q = qty[c.id] ?? 0;
              const max = Math.min(c.max_per_order, Math.max(0, avail));
              return (
                <div key={c.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      {c.benefits && <div className="text-xs text-muted-foreground">{c.benefits}</div>}
                      <div className="mt-1 font-display text-lg font-bold">{ars(c.price)}</div>
                      <div className="text-xs text-muted-foreground">
                        {avail <= 0 || c.status === "agotada" ? "Agotada" : notStarted ? `Desde ${fmtDate(c.sale_start)}` : ended ? "Venta finalizada" : avail < 50 ? `¡Últimas ${avail}!` : "Disponible"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" disabled={disabled || q === 0} onClick={() => setQty({ ...qty, [c.id]: q - 1 })} aria-label="Quitar"><Minus /></Button>
                      <span className="w-6 text-center font-mono font-bold">{q}</span>
                      <Button size="icon" variant="outline" disabled={disabled || q >= max} onClick={() => setQty({ ...qty, [c.id]: q + 1 })} aria-label="Agregar"><Plus /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {count > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid gap-3">
                <Field label="Nombre y apellido" value={buyer.name} onChange={(v) => setBuyer({ ...buyer, name: v })} />
                <Field label="Correo electrónico" type="email" value={buyer.email} onChange={(v) => setBuyer({ ...buyer, email: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Teléfono" value={buyer.phone} onChange={(v) => setBuyer({ ...buyer, phone: v })} />
                  <Field label="DNI" value={buyer.dni} onChange={(v) => setBuyer({ ...buyer, dni: v })} />
                </div>
                <Field label="Código de RRPP (opcional)" value={rrpp} onChange={setRrpp} />
              </div>
              <dl className="space-y-1 text-sm">
                <Row k={`Entradas (${count})`} v={ars(subtotal)} />
                <Row k={`Cargo por servicio (${ev.service_fee_pct}%)`} v={ars(fee)} />
                <Row k="Total" v={ars(subtotal + fee)} strong />
              </dl>
              <p className="text-xs text-muted-foreground">El importe final lo calcula nuestro sistema con los precios vigentes.</p>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
                <span>Acepto los <Link to="/terminos" className="text-primary underline">términos</Link> y la <Link to="/devoluciones" className="text-primary underline">política de devoluciones</Link>.</span>
              </label>
              <Button variant="brand" size="lg" className="w-full" disabled={busy || !canBuy} onClick={checkout}>
                {user ? (busy ? "Reservando…" : "Continuar al pago") : "Ingresá para comprar"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Reservamos tus entradas por 15 minutos.</p>
            </div>
          )}
        </aside>
      </div>
    </PublicLayout>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-border pt-2 text-base font-bold" : "text-muted-foreground"}`}>
      <dt>{k}</dt><dd>{v}</dd>
    </div>
  );
}
