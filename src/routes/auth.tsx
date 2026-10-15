import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

function safePath(p: unknown) {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/mis-entradas";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({
    meta: [
      { title: "Ingresar — EGRESANTOS" },
      { name: "description", content: "Ingresá o creá tu cuenta para comprar entradas y ver tus QR." },
      { property: "og:title", content: "Ingresar — EGRESANTOS" },
      { property: "og:description", content: "Accedé a tu cuenta de EGRESANTOS." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safePath(redirect);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (redirect) window.sessionStorage.setItem("egr_after_login", target);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const t = window.sessionStorage.getItem("egr_after_login") ?? target;
        window.sessionStorage.removeItem("egr_after_login");
        navigate({ to: t, replace: true });
      }
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) {
        const t = window.sessionStorage.getItem("egr_after_login") ?? target;
        window.sessionStorage.removeItem("egr_after_login");
        navigate({ to: t, replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, redirect, target]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin + target, data: { full_name: name } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Te enviamos un correo para confirmar tu cuenta.");
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("No pudimos iniciar sesión con Google");
  }
  async function forgot() {
    if (!email) { toast.error("Ingresá tu correo primero"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success("Te enviamos un enlace para restablecer la contraseña.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 grid-lines">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-card">
        <a href="/" className="mb-6 inline-block"><Logo /></a>
        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="in">Ingresar</TabsTrigger>
            <TabsTrigger value="up">Crear cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="in">
            <form onSubmit={signIn} className="mt-4 space-y-4">
              <F label="Correo"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></F>
              <F label="Contraseña"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></F>
              <Button type="submit" variant="brand" className="w-full" disabled={busy}>Ingresar</Button>
              <button type="button" onClick={forgot} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">¿Olvidaste tu contraseña?</button>
            </form>
          </TabsContent>
          <TabsContent value="up">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <F label="Nombre y apellido"><Input required value={name} onChange={(e) => setName(e.target.value)} /></F>
              <F label="Correo"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></F>
              <F label="Contraseña"><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></F>
              <Button type="submit" variant="brand" className="w-full" disabled={busy}>Crear cuenta</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />o<div className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" className="w-full" onClick={google}>Continuar con Google</Button>
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
