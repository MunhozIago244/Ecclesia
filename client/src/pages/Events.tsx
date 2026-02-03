"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents, useCreateEvent } from "@/hooks/use-schedules";
import { useUser } from "@/hooks/use-auth";
import { useMinistries } from "@/hooks/use-ministries";
import { useCreateAssignment } from "@/hooks/use-assignments";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  UserPlus,
  Star,
  ChevronRight,
  Info,
  Plus,
  Loader2,
  Calendar,
  Layout,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Events() {
  const { data: user } = useUser();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: ministries } = useMinistries();
  const { mutate: createEvent, isPending: isCreatingEvent } = useCreateEvent();
  const { mutate: requestJoin, isPending: isRequesting } =
    useCreateAssignment();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [openCreate, setOpenCreate] = useState(false);

  // States para Solicitação
  const [selectedMinistry, setSelectedMinistry] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // States para Criação (Admin)
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    description: "",
    locationId: "",
  });

  const canManage = user?.role === "admin" || user?.role === "leader";

  // Aqui está a correção: buscamos em .functions e não em .roles
  const availableRoles =
    ministries?.find((m) => String(m.id) === selectedMinistry)?.functions || [];

  const handleOpenJoinRequest = (event: any) => {
    setSelectedEvent(event);
    // Remove lógica de preferences que não existe no schema
  };

  const handleConfirmRequest = () => {
    if (!selectedEvent || !selectedRole) return;

    requestJoin(
      {
        eventId: selectedEvent.id,
        roleName: selectedRole,
        ministryId: Number(selectedMinistry),
        status: "pending",
      },
      {
        onSuccess: () => {
          toast({
            title: "Solicitação enviada!",
            description: "Aguarde a aprovação do seu líder.",
          });
          setSelectedEvent(null);
          setSelectedRole("");
          setSelectedMinistry("");
        },
        onError: () =>
          toast({
            title: "Erro",
            description: "Não foi possível enviar sua solicitação.",
            variant: "destructive",
          }),
      },
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    // O schema espera Date e locationId como número ou null
    createEvent(
      {
        ...newEvent,
        date: new Date(newEvent.date),
        locationId: newEvent.locationId ? Number(newEvent.locationId) : null,
      },
      {
        onSuccess: () => {
          toast({
            title: "Evento Criado",
            description: "O evento foi agendado com sucesso.",
          });
          setOpenCreate(false);
          setNewEvent({
            name: "",
            date: "",
            time: "",
            description: "",
            locationId: "",
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-10">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase text-foreground">
              Próximos <span className="text-primary italic">Eventos</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">
              Candidate-se para servir nos próximos cultos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="hidden md:flex px-5 py-2.5 rounded-2xl border-border bg-card shadow-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] gap-2"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Badge>

            {canManage && (
              <Button
                onClick={() => setOpenCreate(true)}
                className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 gap-3 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> Novo Evento
              </Button>
            )}
          </div>
        </motion.header>

        {/* LISTAGEM */}
        <div className="grid gap-6">
          {loadingEvents ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />
              ))}
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
                  className="group bg-card border border-border rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                >
                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center h-24 w-24 rounded-[2rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0 group-hover:rotate-3 transition-transform">
                      <span className="text-3xl font-black leading-none">
                        {format(new Date(event.date), "dd")}
                      </span>
                      <span className="text-[10px] uppercase font-black mt-1">
                        {format(new Date(event.date), "MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-4 text-muted-foreground font-bold mt-2">
                        <div className="flex items-center gap-2 text-sm bg-secondary/50 px-4 py-1.5 rounded-full border border-border">
                          <Clock className="w-4 h-4 text-primary" />{" "}
                          {event.time}h
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenJoinRequest(event)}
                    className="w-full md:w-auto h-16 px-10 rounded-[1.5rem] bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg gap-3 shadow-xl transition-all"
                  >
                    <UserPlus className="w-6 h-6" /> Quero Servir
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-24 bg-card rounded-[3rem] border-2 border-dashed border-border opacity-60">
              <Layout className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-xl font-black uppercase tracking-tighter text-muted-foreground">
                Nenhum evento agendado
              </p>
            </div>
          )}
        </div>

        {/* MODAL: CRIAR EVENTO (ADMIN/LEADER) */}
        <AnimatePresence>
          {openCreate && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <form onSubmit={handleCreateEvent}>
                  <div className="p-10 bg-primary text-primary-foreground relative">
                    <Calendar className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                    <DialogHeader className="relative z-10">
                      <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                        Novo Evento
                      </DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="p-10 space-y-5">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Nome
                      </Label>
                      <Input
                        value={newEvent.name}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, name: e.target.value })
                        }
                        className="rounded-2xl bg-muted/50 h-14 font-bold border-none"
                        required
                        placeholder="Ex: Culto de Domingo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase ml-1 opacity-60">
                          Data
                        </Label>
                        <Input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, date: e.target.value })
                          }
                          className="rounded-2xl bg-muted/50 h-14 font-bold border-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase ml-1 opacity-60">
                          Horário
                        </Label>
                        <Input
                          type="time"
                          value={newEvent.time}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, time: e.target.value })
                          }
                          className="rounded-2xl bg-muted/50 h-14 font-bold border-none"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isCreatingEvent}
                      className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl mt-4"
                    >
                      {isCreatingEvent ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Agendar Evento"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* MODAL: SOLICITAR SERVIÇO */}
        <AnimatePresence>
          {selectedEvent && (
            <Dialog
              open={!!selectedEvent}
              onOpenChange={() => setSelectedEvent(null)}
            >
              <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <div className="p-10 md:p-12 bg-slate-900 text-white relative">
                  <Star className="absolute -right-4 -top-4 w-32 h-32 opacity-10 rotate-12 fill-current" />
                  <DialogHeader>
                    <DialogTitle className="text-4xl font-black uppercase tracking-tighter relative z-10">
                      Candidatar-se <br />
                      <span className="text-primary italic">para servir</span>
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="p-10 md:p-12 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Ministério
                      </Label>
                      <Select
                        value={selectedMinistry}
                        onValueChange={setSelectedMinistry}
                      >
                        <SelectTrigger className="h-16 rounded-2xl bg-muted/50 border-none font-bold text-lg">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {ministries?.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={String(m.id)}
                              className="rounded-xl"
                            >
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Função
                      </Label>
                      <Select
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        disabled={!selectedMinistry}
                      >
                        <SelectTrigger className="h-16 rounded-2xl bg-muted/50 border-none font-bold text-lg">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {availableRoles.map((role: string, idx: number) => (
                            <SelectItem
                              key={idx}
                              value={role}
                              className="rounded-xl"
                            >
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleConfirmRequest}
                    disabled={!selectedRole || isRequesting}
                    className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground font-black text-xl gap-3 shadow-2xl transition-all"
                  >
                    {isRequesting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Confirmar Candidatura{" "}
                        <ChevronRight className="w-6 h-6" />
                      </>
                    )}
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
