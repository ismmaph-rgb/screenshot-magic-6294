import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck, QrCode, Zap } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { EventCard } from "@/components/site/EventCard";
import { Button } from "@/components/ui/button";
import { listPublicEvents } from "@/lib/public.functions";

export const eventsQuery = queryOptions({ queryKey: ["public-events"], queryFn: () => listPublicEvents() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EGRESANTOS — Entradas para egresados, festivales y eventos" },
      { name: "description", content: "La ticketera de San Juan: comprá entradas seguras con QR individual para fiestas de egresados, festivales y espectáculos." },
      { property: "og:title", content: "EGRESANTOS — Entradas para egresados y eventos" },
      { property: "og:description", content: "Entradas con QR individual, pago seguro y control de acceso en tiempo real." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  component: Index,
});

function Index() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const featured = events.slice(0, 6);
  const hero = events[0];
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-border">
        {hero?.cover_url && (
          <img src={hero.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" width={1600} height={900} />
        )}
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 md:pb-28 md:pt-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            San Juan · Temporada 2026
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
            Tu noche empieza <span className="text-gradient">con tu entrada.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Fiestas de egresados, festivales y espectáculos. Pagás seguro, recibís un QR por persona y entrás sin filas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="brand" size="xl"><Link to="/eventos">Ver eventos</Link></Button>
            <Button asChild variant="outline" size="xl"><Link to="/mis-entradas">Mis entradas</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Próximos eventos</h2>
          <Link to="/eventos" className="text-sm font-semibold text-primary hover:underline">Ver todos</Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted-foreground">Pronto vas a encontrar eventos acá.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-20 sm:px-6 md:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Pago seguro", d: "Mercado Pago verifica cada operación. Ninguna entrada se habilita sin pago confirmado." },
          { icon: QrCode, t: "Un QR por persona", d: "Cada entrada tiene un código único e intransferible, con respaldo alfanumérico." },
          { icon: Zap, t: "Ingreso en segundos", d: "Control de acceso en tiempo real: cada código se valida una sola vez." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-6">
            <Icon className="mb-4 h-7 w-7 text-primary" />
            <h3 className="mb-1 font-semibold">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}
