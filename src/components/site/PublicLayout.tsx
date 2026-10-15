import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Ticket, ScanLine, LayoutDashboard, LogOut, Megaphone, Menu } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, isAdmin, isDoor, isRrpp } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!user) {
    return (
      <Button asChild variant="brand" size="sm"><Link to="/auth">Ingresar</Link></Button>
    );
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Menu /> Mi cuenta</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/mis-entradas"><Ticket /> Mis entradas</Link></DropdownMenuItem>
        {isRrpp && <DropdownMenuItem asChild><Link to="/rrpp"><Megaphone /> Panel RRPP</Link></DropdownMenuItem>}
        {isDoor && <DropdownMenuItem asChild><Link to="/escaner"><ScanLine /> Control de acceso</Link></DropdownMenuItem>}
        {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><LayoutDashboard /> Panel admin</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}><LogOut /> Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/eventos" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Eventos</Link>
            <Link to="/mis-entradas" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Mis entradas</Link>
            <Link to="/ayuda" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Ayuda</Link>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="no-print border-t border-border bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">Entradas para egresados, festivales y eventos. Hecho en San Juan, Argentina.</p>
          </div>
          <FooterCol title="Explorar" links={[["/eventos", "Eventos"], ["/mis-entradas", "Mis entradas"]]} />
          <FooterCol title="Ayuda" links={[["/ayuda", "Preguntas frecuentes y contacto"], ["/devoluciones", "Política de devoluciones"]]} />
          <FooterCol title="Legal" links={[["/terminos", "Términos y condiciones"], ["/privacidad", "Política de privacidad"]]} />
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EGRESANTOS · egresantos.site · Precios en pesos argentinos (ARS)
        </div>
      </footer>
    </div>
  );
}

type FooterPath = "/eventos" | "/mis-entradas" | "/ayuda" | "/devoluciones" | "/terminos" | "/privacidad";
function FooterCol({ title, links }: { title: string; links: [FooterPath, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
