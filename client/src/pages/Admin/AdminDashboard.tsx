import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { useUser } from "@/hooks/use-auth";
import { useMinistries } from "@/hooks/use-ministries";
import { useSchedules, useEvents } from "@/hooks/use-schedules";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Church,
  Calendar,
  Activity,
  Settings,
  Shield,
  ClipboardList,
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: user } = useUser();
  const { data: ministries } = useMinistries();
  const { data: schedules } = useSchedules();
  const { data: events } = useEvents();

  const { data: users } = useQuery<any[]>({ 
    queryKey: ["/api/admin/users"] 
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-8 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral e ferramentas de controle do sistema
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ministérios"
            value={ministries?.length || 0}
            icon={Church}
            description="Cadastrados"
          />
          <StatCard
            title="Eventos"
            value={events?.length || 0}
            icon={Calendar}
            description="Agendados"
          />
          <StatCard
            title="Escalas"
            value={schedules?.length || 0}
            icon={Activity}
            description="Geradas"
          />
          <StatCard
            title="Usuários"
            value={users?.length || 0}
            icon={Users}
            description="Sistema"
          />
        </div>

        {/* Ferramentas administrativas */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Ferramentas Administrativas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/users">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Usuários</h3>
                <p className="text-muted-foreground text-sm">
                  Permissões, funções e status
                </p>
              </div>
            </Link>

            <Link href="/admin/ministries">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Church className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Ministérios</h3>
                <p className="text-muted-foreground text-sm">
                  Organização e liderança
                </p>
              </div>
            </Link>

            <Link href="/admin/events">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Cultos & Eventos</h3>
                <p className="text-muted-foreground text-sm">
                  Frequência, horários e exceções
                </p>
              </div>
            </Link>

            <Link href="/admin/schedules">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Escalas</h3>
                <p className="text-muted-foreground text-sm">
                  Geração e controle
                </p>
              </div>
            </Link>

            <Link href="/admin/settings">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Configurações</h3>
                <p className="text-muted-foreground text-sm">
                  Sistema e preferências
                </p>
              </div>
            </Link>

            <Link href="/admin/audit">
              <div className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Auditoria</h3>
                <p className="text-muted-foreground text-sm">
                  Logs e histórico
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
