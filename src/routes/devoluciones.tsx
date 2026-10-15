import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/devoluciones")({
  head: () => ({ meta: [{ title: "Política de devoluciones — EGRESANTOS" }, { name: "description", content: "Política de devoluciones en EGRESANTOS." }, { property: "og:title", content: "Política de devoluciones — EGRESANTOS" }, { property: "og:description", content: "Política de devoluciones en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Política de devoluciones</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
