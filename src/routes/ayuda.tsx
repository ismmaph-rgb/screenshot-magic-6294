import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/ayuda")({
  head: () => ({ meta: [{ title: "Ayuda y contacto — EGRESANTOS" }, { name: "description", content: "Ayuda y contacto en EGRESANTOS." }, { property: "og:title", content: "Ayuda y contacto — EGRESANTOS" }, { property: "og:description", content: "Ayuda y contacto en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Ayuda y contacto</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
