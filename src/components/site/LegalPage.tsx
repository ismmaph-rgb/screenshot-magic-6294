import type { ReactNode } from "react";
import { PublicLayout } from "./PublicLayout";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl space-y-5 px-4 py-14 text-muted-foreground sm:px-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Texto base preliminar. Debe ser revisado por un profesional legal antes de operar.
        </p>
        {children}
      </article>
    </PublicLayout>
  );
}
