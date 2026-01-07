"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents } from "@/hooks/use-schedules";
import { useUser } from "@/hooks/use-auth";
import { useMinistries } from "@/hooks/use-ministries"; 
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, UserPlus, Star, ChevronRight, Loader2, Info, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Parâmetros de animação para consistência entre páginas
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function Schedules() {
  const { data: user } = useUser();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: ministries } = useMinistries();
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const userPreferences = user?.preferences || [];

  const handleOpenJoinRequest = (event: any) => {
    setSelectedEvent(event);
    if (userPreferences.length === 1) {
      setSelectedMinistry(String(userPreferences[0].ministryId));
      setSelectedRole(userPreferences[0].roleName);
    }
  };

  const availableRoles = ministries?.find(m => String(m.id) === selectedMinistry)?.roles || [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        {/* HEADER COM PADRÃO DASHBOARD (x: -20) */}
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Próximas <span className="text-primary italic">Escalas</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Encontre uma oportunidade para servir à comunidade.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-2xl border border-border">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Janeiro 2026</span>
          </div>
        </motion.header>

        {/* LISTA DE EVENTOS COM STAGGERED FADE-IN */}
        <div className="grid gap-6">
          {loadingEvents ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-[2rem]" />)}
            </div>
          ) : events?.length ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6"
            >
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group bg-card border border-border rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    {/* DATA CIRCULAR ESTILO BADGE */}
                    <div className="flex flex-col items-center justify-center h-24 w-24 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                      <span className="text-3xl font-black leading-none">{format(new Date(event.date), "dd")}</span>
                      <span className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">
                        {format(new Date(event.date), "MMM", { locale: ptBR })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-4 text-muted-foreground font-bold">
                        <div className="flex items-center gap-1.5 text-sm bg-secondary px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-primary" />
                          {event.time}h
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <CalendarDays className="w-4 h-4" />
                          {format(new Date(event.date), "EEEE", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleOpenJoinRequest(event)} 
                    className="w-full md:w-auto h-16 px-10 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg gap-3 transition-all shadow-xl shadow-black/5"
                  >
                    <UserPlus className="w-6 h-6" /> Quero Servir
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-card rounded-[3rem] border-2 border-dashed border-border"
            >
              <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">Nenhum evento agendado para os próximos dias.</p>
            </motion.div>
          )}
        </div>

        {/* MODAL DE INSCRIÇÃO REESTILIZADO COM ANIMATE PRESENCE */}
        <AnimatePresence>
          {selectedEvent && (
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
              <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="p-8 md:p-12 bg-primary text-primary-foreground relative">
                    <Star className="absolute -right-4 -top-4 w-32 h-32 opacity-20 rotate-12 fill-current" />
                    <DialogHeader className="relative z-10">
                      <DialogTitle className="text-4xl font-black leading-tight">
                        Como você deseja <br /><span className="opacity-70 italic">ajudar hoje?</span>
                      </DialogTitle>
                    </DialogHeader>
                  </div>

                  <div className="p-8 md:p-12 space-y-8">
                    {/* SEÇÃO DE PREFERÊNCIAS */}
                    {userPreferences.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Sugestões para seu perfil
                          </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {userPreferences.map((pref: any, idx: number) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                setSelectedMinistry(String(pref.ministryId));
                                setSelectedRole(pref.roleName);
                              }}
                              className={cn(
                                "flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all text-left group",
                                selectedRole === pref.roleName 
                                  ? "border-primary bg-primary/5 shadow-inner" 
                                  : "border-border hover:border-primary/50 bg-muted/30"
                              )}
                            >
                              <div>
                                <p className="font-black text-lg">{pref.roleName}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter opacity-70">
                                  {pref.ministryName}
                                </p>
                              </div>
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                selectedRole === pref.roleName ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                              )}>
                                <Check className={cn("w-5 h-5", selectedRole === pref.roleName ? "opacity-100" : "opacity-0")} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SEPARADOR DINÂMICO */}
                    <div className="relative flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-border" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Ou escolha outro</span>
                      <div className="h-[1px] flex-1 bg-border" />
                    </div>

                    {/* SELEÇÃO MANUAL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase ml-1 opacity-60">Ministério</Label>
                        <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border">
                            {ministries?.map(m => (
                              <SelectItem key={m.id} value={String(m.id)} className="rounded-xl font-medium">
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase ml-1 opacity-60">Função</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!selectedMinistry}>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border">
                            {availableRoles.map((role: any) => (
                              <SelectItem key={role.id} value={role.name} className="rounded-xl font-medium">
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button 
                        className="w-full h-16 rounded-[1.5rem] bg-primary font-black text-xl shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all" 
                        disabled={!selectedRole}
                      >
                        Confirmar Disponibilidade <ChevronRight className="w-6 h-6" />
                      </Button>
                    </DialogFooter>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}