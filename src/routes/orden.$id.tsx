import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/orden/$id")({
  head: () => ({ meta: [{ title: "Tu orden — EGRESANTOS" }, { name: "description", content: "Tu orden en EGRESANTOS." }, { property: "og:title", content: "Tu orden — EGRESANTOS" }, { property: "og:description", content: "Tu orden en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Tu orden</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
