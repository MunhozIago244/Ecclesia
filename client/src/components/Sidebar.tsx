import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Church,
  Calendar,
  ClipboardList,
  MapPin,
  Mic2,
  LogOut,
  Shield,
  UserCheck,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  // --- Lógica de Tema ---
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // --- Busca de Aprovações ---
  const { data: pendingData } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/ministry-requests/count"],
    enabled: !!user && (user.role === "admin" || user.role === "leader"),
  });

  const pendingCount = pendingData?.count || 0;

  const menuItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Ministérios", href: "/ministries", icon: Users },
    { label: "Cultos", href: "/services", icon: Church },
    { label: "Eventos", href: "/events", icon: Calendar },
    { label: "Escalas", href: "/schedules", icon: ClipboardList },
    { label: "Locais", href: "/locations", icon: MapPin },
    { label: "Equipamentos", href: "/equipments", icon: Mic2 },
  ];

  const isAdminOrLeader = user?.role === "admin" || user?.role === "leader";

  return (
    <div className="h-screen w-64 bg-card border-r border-border fixed left-0 top-0 hidden md:flex flex-col transition-all duration-300 shadow-xl shadow-black/5">
      {/* LOGO SECTION */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl bg-gradient-to-br from-indigo-600 to-violet-500 bg-clip-text text-transparent leading-none">
            Ecclesia
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mt-1">
            Smart Church
          </p>
        </div>

        {/* THEME TOGGLE BUTTON */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto scrollbar-none">
        {/* SEÇÃO GESTÃO (ADMIN) */}
        {isAdminOrLeader && (
          <div className="space-y-1">
            <h2 className="px-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3">
              Administração
            </h2>

            {user?.role === "admin" && (
              <SidebarItem
                href="/admin"
                icon={Shield}
                label="Painel Admin"
                active={location === "/admin"}
              />
            )}

            <SidebarItem
              href="/admin/approvals"
              icon={UserCheck}
              label="Aprovações"
              active={location === "/admin/approvals"}
              badge={pendingCount}
            />
          </div>
        )}

        {/* MENU PRINCIPAL */}
        <div className="space-y-1">
          <h2 className="px-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3">
            Explorar
          </h2>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={location === item.href}
            />
          ))}
        </div>
      </nav>

      {/* FOOTER DO USUÁRIO - CLICÁVEL PARA PERFIL */}
      <div className="p-4 m-4 bg-muted/40 rounded-[2rem] border border-border/40 space-y-2">
        <Link href="/profile">
          <div
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-2xl cursor-pointer transition-all hover:bg-primary/5 group/user",
              location === "/profile" && "bg-primary/10 ring-1 ring-primary/20",
            )}
          >
            <Avatar className="w-10 h-10 rounded-2xl shadow-lg shadow-primary/20 transition-transform group-hover/user:scale-105">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-tr from-primary to-violet-500 text-white font-bold">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground group-hover/user:text-primary transition-colors">
                {user?.name}
              </p>
              <Badge
                variant="outline"
                className="text-[9px] h-4 py-0 font-bold uppercase tracking-tight bg-background border-primary/20 text-primary/80"
              >
                {user?.role}
              </Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover/user:text-primary group-hover/user:translate-x-1 transition-all" />
          </div>
        </Link>

        <div className="h-px bg-border/40 mx-2 my-1" />

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl group px-2 h-10"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Sair da conta
          </span>
        </Button>
      </div>
    </div>
  );
}

// COMPONENTE AUXILIAR PARA ITENS DA SIDEBAR
function SidebarItem({ href, icon: Icon, label, active, badge }: any) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
            : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1",
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              "w-5 h-5",
              active
                ? "text-white"
                : "text-muted-foreground group-hover:text-primary transition-colors",
            )}
          />
          {label}
        </div>

        {badge > 0 && (
          <Badge
            className={cn(
              "h-5 min-w-5 flex items-center justify-center px-1 font-black animate-pulse",
              active ? "bg-white text-primary" : "bg-destructive text-white",
            )}
          >
            {badge}
          </Badge>
        )}
      </div>
    </Link>
  );
}
