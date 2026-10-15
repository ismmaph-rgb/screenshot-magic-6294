import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
export const Route = createFileRoute("/privacidad")({
  head: () => ({ meta: [{ title: "Política de privacidad — EGRESANTOS" }, { name: "description", content: "Política de privacidad en EGRESANTOS." }, { property: "og:title", content: "Política de privacidad — EGRESANTOS" }, { property: "og:description", content: "Política de privacidad en EGRESANTOS." }] }),
  component: () => (<PublicLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Política de privacidad</h1><p className="mt-3 text-muted-foreground">Esta sección todavía está en construcción.</p></div></PublicLayout>),
});
