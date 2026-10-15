import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/rrpp")({
  head: () => ({ meta: [{ title: "Panel RRPP — EGRESANTOS" }, { name: "description", content: "Panel RRPP en EGRESANTOS." }, { property: "og:title", content: "Panel RRPP — EGRESANTOS" }, { property: "og:description", content: "Panel RRPP en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Panel RRPP</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
