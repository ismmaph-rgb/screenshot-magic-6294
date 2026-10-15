import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/terminos")({
  head: () => ({ meta: [{ title: "Términos y condiciones — EGRESANTOS" }, { name: "description", content: "Términos y condiciones en EGRESANTOS." }, { property: "og:title", content: "Términos y condiciones — EGRESANTOS" }, { property: "og:description", content: "Términos y condiciones en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Términos y condiciones</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
