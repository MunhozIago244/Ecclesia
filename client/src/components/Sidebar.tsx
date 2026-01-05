import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Church, 
  Calendar, 
  ClipboardList, 
  MapPin, 
  Mic2, 
  LogOut 
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
        <h1 className="font-display font-bold text-2xl text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
          Ecclesia
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Gestão de Igrejas</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
