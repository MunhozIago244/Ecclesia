"use client";

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
  ArrowUpRight,
  BellRing,
  ShieldCheck,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Variantes de animação para o container e itens
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function AdminDashboard() {
  const { data: user } = useUser();
  const { data: ministries } = useMinistries();
  const { data: schedules } = useSchedules();
  const { data: events } = useEvents();

  const { data: pendingCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/ministry-requests/count"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/20">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-12">
        {/* HEADER COM ANIMAÇÃO */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3 h-3" />
              Sovereign Access
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter">
              Admin<span className="text-primary italic">Panel</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Operando como <span className="text-foreground font-bold">{user.name}</span>.
            </p>
          </div>

          {/* NOTIFICAÇÃO ESTILIZADA */}
          {pendingCount && pendingCount.count > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/admin/approvals">
                <div className="relative group bg-card border-2 border-primary/20 p-5 rounded-[2rem] cursor-pointer overflow-hidden transition-all hover:border-primary/50 shadow-lg shadow-primary/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                      <BellRing className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Pendências</p>
                      <p className="text-lg font-black text-foreground">
                        {pendingCount.count} Solicitações
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </motion.header>

        {/* MÉTRICAS EM GRID ANIMADO */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <StatCard title="Ministérios" value={ministries?.length || 0} icon={Church} description="Frentes ativas" trend="+2 este mês" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Eventos" value={events?.length || 0} icon={Calendar} description="Próximos 30 dias" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Escalas" value={schedules?.length || 0} icon={Activity} description="Publicadas" trend="98% cobertura" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Usuários" value={users?.length || 0} icon={Users} description="Membros ativos" trend="+12 novos" />
          </motion.div>
        </motion.div>

        {/* FERRAMENTAS COM HOVER EFFECTS AVANÇADOS */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2 rounded-lg bg-foreground text-background">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Quick Actions</h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminToolLink 
              href="/admin/users" 
              icon={Users} 
              title="Usuários" 
              desc="Gerencie permissões, cargos e acesso dos membros com total controle." 
              color="primary" 
            />
            <AdminToolLink 
              href="/admin/ministries" 
              icon={Church} 
              title="Ministérios" 
              desc="Organize líderes, funções e departamentos da instituição." 
              color="primary" 
            />
            <AdminToolLink 
              href="/admin/events" 
              icon={Calendar} 
              title="Cultos & Eventos" 
              desc="Gestão de horários fixos, feriados e calendários especiais." 
              color="primary" 
            />
            <AdminToolLink 
              href="/admin/schedules" 
              icon={ClipboardList} 
              title="Escalas" 
              desc="Controle a geração inteligente e manual de escalas semanais." 
              color="primary" 
            />
            <AdminToolLink 
              href="/admin/settings" 
              icon={Settings} 
              title="Preferências" 
              desc="Customização de sistema, e-mails e regras de negócio." 
              color="primary" 
            />
            <AdminToolLink 
              href="/admin/audit" 
              icon={Shield} 
              title="Segurança" 
              desc="Visualize logs de ações e histórico completo do banco de dados." 
              color="primary" 
            />
          </div>
        </motion.section>

        {/* FOOTER / STATUS BOX */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-6 rounded-[2rem] bg-muted/30 border border-border flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold opacity-70 italic font-display">Sistema operando em tempo real</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Idealizador: Iago Munhoz</span>
            <span>Desenvolvedor: Iago Munhoz</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function AdminToolLink({ href, icon: Icon, title, desc }: any) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group bg-card border border-border rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer relative overflow-hidden"
      >
        {/* Ícone com Background Dinâmico */}
        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:rotate-[10deg] shadow-inner">
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-foreground tracking-tighter">
              {title}
            </h3>
            <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed font-medium">
            {desc}
          </p>
        </div>

        {/* Efeito de Gradiente no Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Detalhe estético no canto */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-muted/20 rounded-full group-hover:bg-primary/5 transition-all duration-700 blur-2xl" />
      </motion.div>
    </Link>
  );
}