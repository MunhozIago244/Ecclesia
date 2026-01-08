"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents } from "@/hooks/use-schedules";
import { useUser } from "@/hooks/use-auth";
import { useMinistries } from "@/hooks/use-ministries"; 
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, UserPlus, Star, ChevronRight, Info, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function Events() {
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
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Próximos <span className="text-primary italic">Eventos</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Candidate-se para servir nos próximos cultos e eventos.
            </p>
          </div>
        </motion.header>

        <div className="grid gap-6">
          {loadingEvents ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-[2rem]" />)}
            </div>
          ) : events?.length ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className="group bg-card border border-border rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center h-24 w-24 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                      <span className="text-3xl font-black">{format(new Date(event.date), "dd")}</span>
                      <span className="text-[10px] uppercase font-black">{format(new Date(event.date), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{event.name}</h3>
                      <div className="flex items-center gap-4 text-muted-foreground font-bold">
                        <div className="flex items-center gap-1.5 text-sm bg-secondary px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-primary" /> {event.time}h
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleOpenJoinRequest(event)} className="w-full md:w-auto h-16 px-10 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg gap-3 shadow-xl shadow-black/5">
                    <UserPlus className="w-6 h-6" /> Quero Servir
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-card rounded-[3rem] border-2 border-dashed border-border">
              <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">Nenhum evento agendado.</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedEvent && (
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
              <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <div className="p-8 md:p-12 bg-primary text-primary-foreground relative">
                  <Star className="absolute -right-4 -top-4 w-32 h-32 opacity-20 rotate-12 fill-current" />
                  <DialogTitle className="text-4xl font-black leading-tight relative z-10">
                    Como você deseja <br /><span className="opacity-70 italic">ajudar hoje?</span>
                  </DialogTitle>
                </div>
                <div className="p-8 md:p-12 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase ml-1 opacity-60">Ministério</Label>
                      <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ministries?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase ml-1 opacity-60">Função</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!selectedMinistry}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role: any) => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full h-16 rounded-[1.5rem] bg-primary font-black text-xl gap-2 transition-all" disabled={!selectedRole}>
                    Confirmar Disponibilidade <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}