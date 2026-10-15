import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/mis-entradas")({
  head: () => ({ meta: [{ title: "Mis entradas — EGRESANTOS" }, { name: "description", content: "Mis entradas en EGRESANTOS." }, { property: "og:title", content: "Mis entradas — EGRESANTOS" }, { property: "og:description", content: "Mis entradas en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Mis entradas</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
