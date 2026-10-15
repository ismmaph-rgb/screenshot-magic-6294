import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Panel de administración — EGRESANTOS" }, { name: "description", content: "Panel de administración en EGRESANTOS." }, { property: "og:title", content: "Panel de administración — EGRESANTOS" }, { property: "og:description", content: "Panel de administración en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Panel de administración</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
