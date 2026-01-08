"use client";

import { Sidebar } from "@/components/Sidebar";
import { useSchedules } from "@/hooks/use-schedules";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, History, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Schedules() {
  const { data: allSchedules, isLoading } = useSchedules();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Escalas <span className="text-primary">Confirmadas</span>
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Confira quem está escalado para os próximos serviços.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-2xl" />)
          ) : allSchedules?.length ? (
            allSchedules.map((sched: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={sched.id}
                className="p-5 bg-card border border-border rounded-[2rem] flex items-center justify-between hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-lg leading-none mb-1">{sched.user?.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                        {sched.ministry?.name}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {sched.event?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right hidden md:block">
                      <p className="text-xs font-black uppercase tracking-tighter">
                        {sched.event?.date ? format(new Date(sched.event.date), "dd 'de' MMM", { locale: ptBR }) : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">Às {sched.event?.time}h</p>
                   </div>
                   <Badge status={sched.status} />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 opacity-30">
              <History className="w-16 h-16 mx-auto mb-4" />
              <p className="font-black uppercase italic">Nenhuma escala encontrada.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles: any = {
    pendente: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    confirmado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    recusado: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase border", styles[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}