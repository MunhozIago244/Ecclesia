"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { useSchedules, useEvents } from "@/hooks/use-schedules";
import { useMinistries } from "@/hooks/use-ministries";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  ClipboardList,
  Church,
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Heart,
  X,
  Loader2,
} from "lucide-react";
import {
  format,
  isWithinInterval,
  addDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Interfaces
interface UserWithMinistries {
  id: number;
  name: string;
  role: string;
  ministries?: Array<{ ministryId: number }>;
}

interface Assignment {
  id: number;
  status: string;
  scheduleId: number;
  userId: number;
  functionId: number;
  notes: string | null;
  functionName?: string;
}

interface Schedule {
  id: number;
  name: string;
  date: string;
  assignments?: Assignment[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const VERSES = [
  {
    text: "Servi uns aos outros conforme o dom que cada um recebeu.",
    ref: "1 Pedro 4:10",
  },
  {
    text: "O que quer que façam, façam de todo o coração para o Senhor.",
    ref: "Colossenses 3:23",
  },
  {
    text: "A colheita é grande, mas os trabalhadores são poucos.",
    ref: "Mateus 9:37",
  },
  {
    text: "Não nos cansemos de fazer o bem, pois colheremos no tempo certo.",
    ref: "Gálatas 6:9",
  },
  { text: "Estou entre vós como aquele que serve.", ref: "Lucas 22:27" },
  { text: "Sirvam ao Senhor com alegria!", ref: "Salmos 100:2" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { data: user } = useUser() as { data: UserWithMinistries | null };
  const { data: schedules, isLoading: isLoadingSchedules } = useSchedules() as {
    data: Schedule[] | undefined;
    isLoading: boolean;
  };
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: ministries, isLoading: isLoadingMinistries } = useMinistries();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [currentVerse, setCurrentVerse] = useState(VERSES[0]);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleOpenModal = () => {
    setSelectedIds(user?.ministries?.map((m) => m.ministryId) || []);
    setIsOpen(true);
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMouseLeaveCard = () => {
    setIsCardHovered(false);
    const randomIndex = Math.floor(Math.random() * VERSES.length);
    setTimeout(() => setCurrentVerse(VERSES[randomIndex]), 300);
  };

  const handleConfirmParticipation = async () => {
    setIsSubmitting(true);
    try {
      const currentMinistryIds =
        user?.ministries?.map((m) => m.ministryId) || [];
      const newRequests = selectedIds.filter(
        (id) => !currentMinistryIds.includes(id)
      );
      if (newRequests.length === 0) {
        setIsOpen(false);
        return;
      }

      await Promise.all(
        newRequests.map((id) =>
          apiRequest("POST", "/api/user/ministry-request", {
            ministryId: id,
            roles: [],
            status: "PENDING",
          })
        )
      );

      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsOpen(false);
      toast({
        title: "Solicitações Enviadas!",
        description: "Seu pedido está em análise.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));
  const servicesThisWeek =
    events?.filter((event) =>
      isWithinInterval(new Date(event.date), { start: today, end: nextWeek })
    ) || [];
  const mySchedules =
    schedules?.filter((s) =>
      s.assignments?.some((a) => a.userId === user?.id)
    ) || [];
  const upcomingEvents =
    events?.filter((e) => new Date(e.date) >= today).slice(0, 3) || [];

  return (
    // FIX: Usando bg-background e transition-colors para bater com ministries.tsx
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-10">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Olá,{" "}
              <span className="text-primary">
                {user?.name?.split(" ")[0] || "Usuário"}
              </span>{" "}
              👋
            </h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">
              Bem-vindo ao painel da sua comunidade.
            </p>
          </div>
          <Badge
            variant="outline"
            className="hidden md:flex px-5 py-2.5 rounded-2xl border-border bg-card shadow-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Badge>
        </motion.header>

        {/* BANNER PRINCIPAL */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative overflow-hidden rounded-[3rem] bg-primary p-8 md:p-14 text-primary-foreground shadow-2xl shadow-primary/20">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/20">
                  <Sparkles className="w-4 h-4 text-white" /> Oportunidades
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                  Descubra seu <br />
                  <span className="opacity-80">Propósito</span>
                </h2>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      onClick={handleOpenModal}
                      className="bg-white text-primary hover:bg-white/90 font-black px-12 h-16 rounded-[1.25rem] group shadow-xl active:scale-95 text-lg"
                    >
                      Quero fazer parte
                      <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-none rounded-[3rem] shadow-2xl bg-card flex flex-col [&>button]:hidden">
                    {/* HEADER DO MODAL */}
                    <div className="p-10 border-b border-border flex items-center justify-between bg-muted/30 relative overflow-hidden">
                      <div className="relative z-10">
                        <DialogTitle className="text-3xl font-black text-foreground tracking-tight">
                          Onde você quer{" "}
                          <span className="text-primary">Servir?</span>
                        </DialogTitle>
                        <p className="text-muted-foreground font-medium mt-1">
                          Selecione os campos que fazem seu coração vibrar.
                        </p>
                      </div>
                      <DialogClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-muted relative z-20"
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </DialogClose>
                    </div>

                    {/* CONTEÚDO COM SCROLL - padding-bottom removido para encostar no rodapé */}
                    <div className="flex-1 overflow-y-auto p-10 pb-0 bg-card">
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-10"
                      >
                        {isLoadingMinistries
                          ? Array(6)
                              .fill(0)
                              .map((_, i) => (
                                <Skeleton
                                  key={i}
                                  className="h-44 rounded-[2.5rem]"
                                />
                              ))
                          : ministries?.map((m: any) => {
                              const isSelected = selectedIds.includes(m.id);
                              return (
                                <motion.div
                                  variants={itemVariants}
                                  key={m.id}
                                  whileHover={{ y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleToggleSelection(m.id)}
                                  className={cn(
                                    "group relative cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center text-center justify-center min-h-[180px]",
                                    isSelected
                                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/5"
                                      : "border-border bg-background shadow-sm hover:shadow-md hover:border-primary/40"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-16 h-16 mb-4 rounded-2xl flex items-center justify-center transition-all",
                                      isSelected
                                        ? "bg-primary text-white"
                                        : "bg-muted text-primary"
                                    )}
                                  >
                                    <Heart
                                      className={cn(
                                        "w-8 h-8",
                                        isSelected && "fill-current"
                                      )}
                                    />
                                  </div>
                                  <span
                                    className={cn(
                                      "font-black text-sm uppercase tracking-wider",
                                      isSelected
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {m.name}
                                  </span>
                                  <div
                                    className={cn(
                                      "absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                      isSelected
                                        ? "bg-primary border-primary scale-110"
                                        : "border-border bg-background"
                                    )}
                                  >
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                      </motion.div>
                    </div>

                    {/* RODAPÉ AJUSTADO - Sem bordas extras e arredondamento casado */}
                    <div className="p-8 bg-primary flex items-center justify-between transition-colors duration-300">
                      <div className="text-primary-foreground">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">
                          Sua Escolha
                        </p>
                        <p className="text-2xl font-black">
                          {selectedIds.length}{" "}
                          {selectedIds.length === 1
                            ? "selecionado"
                            : "selecionados"}
                        </p>
                      </div>

                      <Button
                        onClick={handleConfirmParticipation}
                        disabled={isSubmitting || selectedIds.length === 0}
                        className="bg-background text-foreground hover:bg-background/90 h-14 px-10 rounded-2xl font-black min-w-[200px] shadow-xl border-none transition-all active:scale-95"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          "Confirmar Solicitação"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* CARD DE VERSÍCULO */}
              <div className="hidden lg:block relative group">
                <motion.div
                  onMouseEnter={() => setIsCardHovered(true)}
                  onMouseLeave={handleMouseLeaveCard}
                  animate={{
                    y: isCardHovered ? -5 : [0, -10, 0],
                    rotate: isCardHovered ? 0 : -3,
                    scale: isCardHovered ? 1.05 : 1,
                  }}
                  className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl cursor-default w-[340px] overflow-hidden transition-all duration-500 hover:bg-white/20"
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="font-black text-2xl leading-tight text-white">
                      Sua igreja,
                      <br />
                      seu lugar.
                    </p>
                  </div>

                  <div className="relative min-h-[110px] flex items-center">
                    <AnimatePresence mode="wait">
                      {!isCardHovered ? (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.2 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3 w-full"
                        >
                          <div className="h-3 w-full bg-white rounded-full"></div>
                          <div className="h-3 w-2/3 bg-white rounded-full"></div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="verse"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-3"
                        >
                          <p className="text-white font-bold italic text-lg leading-tight">
                            "{currentVerse.text}"
                          </p>
                          <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">
                            — {currentVerse.ref}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* GRID DE STATS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Ministérios"
              value={ministries?.length || 0}
              icon={Users}
              description="Frentes de serviço"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Eventos"
              value={upcomingEvents.length}
              icon={Calendar}
              description="Próximos 30 dias"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Minhas Escalas"
              value={mySchedules.length}
              icon={ClipboardList}
              description="Sua participação"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Cultos"
              value={servicesThisWeek.length}
              icon={Church}
              description="Esta semana"
            />
          </motion.div>
        </motion.div>

        {/* LISTAS INFERIORES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[2.5rem] border border-border p-8 hover:shadow-xl transition-all"
          >
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3 mb-8">
              <Calendar className="w-7 h-7 text-primary" /> Próximos Eventos
            </h2>
            <div className="space-y-4">
              {isLoadingEvents ? (
                <Skeleton className="h-48 rounded-[2rem]" />
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-5 p-5 rounded-[2rem] bg-muted/50 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-card flex flex-col items-center justify-center border border-border shadow-sm">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                        {format(new Date(event.date), "MMM", { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-black text-foreground">
                        {format(new Date(event.date), "dd")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-lg">
                        {event.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {event.time} •{" "}
                        {event.description || "Comunidade reunida"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[2.5rem] border border-border p-8 hover:shadow-xl transition-all"
          >
            <h2 className="text-2xl font-black text-foreground mb-8 flex items-center gap-3">
              <Star className="w-7 h-7 text-amber-500 fill-amber-500" /> Minhas
              Escalas
            </h2>
            <div className="space-y-4">
              {isLoadingSchedules ? (
                <Skeleton className="h-48 rounded-[2rem]" />
              ) : mySchedules.length > 0 ? (
                mySchedules.map((schedule) => {
                  const assignment = schedule.assignments?.find(
                    (a) => a.userId === user?.id
                  );
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-card flex items-center justify-center text-amber-500 border border-border shadow-sm">
                          <ClipboardList className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="font-black text-foreground text-lg">
                            {schedule.name || "Serviço"}
                          </h3>
                          <p className="text-xs text-amber-600 font-black uppercase tracking-widest">
                            {format(new Date(schedule.date), "dd 'de' MMMM", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-card text-foreground border-amber-500/20 font-black px-4 py-2 rounded-xl text-[10px]">
                        {assignment?.functionName || "Escalado"}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-muted-foreground font-bold bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
                  Nenhuma escala confirmada.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
