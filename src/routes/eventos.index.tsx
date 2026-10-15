import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { EventCard } from "@/components/site/EventCard";
import { Input } from "@/components/ui/input";
import { eventsQuery } from "./index";

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos — EGRESANTOS" },
      { name: "description", content: "Buscá fiestas de egresados, festivales y eventos en San Juan y comprá tus entradas online." },
      { property: "og:title", content: "Eventos — EGRESANTOS" },
      { property: "og:description", content: "Todos los eventos con entradas disponibles en EGRESANTOS." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  component: EventsPage,
});

function EventsPage() {
  const { data } = useSuspenseQuery(eventsQuery);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? data.filter((e) => [e.name, e.venue, e.city].join(" ").toLowerCase().includes(s)) : data;
  }, [q, data]);
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Eventos</h1>
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, lugar o ciudad" className="h-11 pl-9" />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
        {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">No encontramos eventos para "{q}".</p>}
      </div>
    </PublicLayout>
  );
}
