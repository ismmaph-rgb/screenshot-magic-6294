import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — EGRESANTOS" },
      { name: "description", content: "Elegí una nueva contraseña para tu cuenta." },
      { property: "og:title", content: "Restablecer contraseña — EGRESANTOS" },
      { property: "og:description", content: "Elegí una nueva contraseña." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    navigate({ to: "/mis-entradas" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-8">
        <Logo />
        <h1 className="text-xl font-bold">Nueva contraseña</h1>
        <Input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 8 caracteres" />
        <Button variant="brand" className="w-full" type="submit">Guardar</Button>
      </form>
    </div>
  );
}
