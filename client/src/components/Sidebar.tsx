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
  Shield
} from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  const menuItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Ministérios", href: "/ministries", icon: Users },
    { label: "Cultos", href: "/services", icon: Church },
    { label: "Eventos", href: "/events", icon: Calendar },
    { label: "Escalas", href: "/schedules", icon: ClipboardList },
    { label: "Locais", href: "/locations", icon: MapPin },
    { label: "Equipamentos", href: "/equipments", icon: Mic2 },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r border-border fixed left-0 top-0 hidden md:flex flex-col">
      <div className="p-6 border-b border-border/50">
        <h1 className="font-display font-bold text-2xl text-primary">
          Ecclesia
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gestão de Igrejas
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              location === "/admin"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="w-5 h-5" />
            Admin
          </Link>
        )}

        {menuItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
