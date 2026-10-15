import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/escaner")({
  head: () => ({ meta: [{ title: "Control de acceso — EGRESANTOS" }, { name: "description", content: "Control de acceso en EGRESANTOS." }, { property: "og:title", content: "Control de acceso — EGRESANTOS" }, { property: "og:description", content: "Control de acceso en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Control de acceso</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
