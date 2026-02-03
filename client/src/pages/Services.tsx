import { useState, useMemo, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents, useServices, useSchedules } from "@/hooks/use-schedules";
import { useMinistries, useMinistryMembers } from "@/hooks/use-ministries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  Search,
  X,
  Check,
  CalendarDays,
  History,
  UserPlus,
  AlertCircle,
  Ban,
  Calendar as CalendarIcon,
  Clock,
  Share2,
  FileSpreadsheet,
  Download,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// --- HELPERS PARA DATA ---
const DAYS_MAP = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --- DATA HOOKS ---
  const { data: events } = useEvents();
  const { data: services } = useServices();
  const { data: ministries } = useMinistries();
  const { data: allSchedules } = useSchedules();

  // --- STATE ---
  const [contextId, setContextId] = useState<string>("");
  const [contextType, setContextType] = useState<"EVENT" | "SERVICE">("EVENT");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [targetCount, setTargetCount] = useState<number>(3);
  const [draftTeam, setDraftTeam] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // State para Dialog de Compartilhamento
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastPublishedData, setLastPublishedData] = useState<any>(null);

  // --- LOGIC: Handle Context Change ---
  const handleContextChange = (value: string) => {
    const [type, id] = value.split(":");
    setContextId(id);
    setContextType(type as "EVENT" | "SERVICE");

    if (type === "EVENT") {
      const evt = events?.find((e) => String(e.id) === id);
      if (evt) setSelectedDate(new Date(evt.date));
    } else {
      setSelectedDate(undefined); // Reset date for services, user must pick
    }
  };

  // --- DATE BLOCKING LOGIC ---
  const isDateDisabled = (date: Date) => {
    // 1. Bloqueia datas passadas (opcional, mas recomendado)
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

    // 2. Se for EVENTO: Bloqueia tudo que não for a data do evento
    if (contextType === "EVENT" && selectedDate) {
      return !isSameDay(date, selectedDate);
    }

    // 3. Se for CULTO: Bloqueia dias que não correspondem ao dia da semana do culto
    if (contextType === "SERVICE" && contextId) {
      const service = services?.find((s) => String(s.id) === contextId);
      if (service) {
        return date.getDay() !== service.dayOfWeek;
      }
    }
    return false;
  };

  // --- DERIVED DATA ---

  const { data: ministryMembers } = useMinistryMembers(
    selectedMinistryId ? Number(selectedMinistryId) : 0,
  );

  const { availableCandidates, unavailableCandidates } = useMemo(() => {
    if (!ministryMembers || !selectedDate || !allSchedules) {
      return { availableCandidates: [], unavailableCandidates: [] };
    }

    const assignedUserIds = new Set<number>();

    allSchedules.forEach((schedule) => {
      if (isSameDay(new Date(schedule.date), selectedDate)) {
        schedule.assignments.forEach((assignment: any) => {
          assignedUserIds.add(Number(assignment.userId));
        });
      }
    });

    draftTeam.forEach((u) => assignedUserIds.add(u.id));

    const available: any[] = [];
    const unavailable: any[] = [];

    ministryMembers.forEach((member) => {
      if (
        searchTerm &&
        !member.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return;
      }

      if (assignedUserIds.has(member.id)) {
        unavailable.push({ ...member, reason: "Já escalado hoje" });
      } else {
        available.push(member);
      }
    });

    return {
      availableCandidates: available,
      unavailableCandidates: unavailable,
    };
  }, [ministryMembers, selectedDate, allSchedules, draftTeam, searchTerm]);

  // --- ACTIONS ---

  const handleAutoGenerate = () => {
    if (!selectedDate || !selectedMinistryId) {
      return toast({
        title: "Atenção",
        description: "Selecione uma data e ministério primeiro",
        variant: "destructive",
      });
    }

    if (availableCandidates.length === 0) {
      return toast({
        title: "Indisponível",
        description: "Não há voluntários disponíveis para sorteio.",
        variant: "destructive",
      });
    }

    const shuffled = [...availableCandidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);

    setDraftTeam((prev) => [...prev, ...selected]);
    toast({
      title: "Equipe Sorteada!",
      description: `${selected.length} voluntários adicionados.`,
    });
  };

  const publishSchedule = async () => {
    if (draftTeam.length === 0 || !selectedDate) return;

    try {
      // 1. Find or Create Schedule
      let schedule = allSchedules?.find(
        (s) =>
          isSameDay(new Date(s.date), selectedDate) &&
          (contextType === "EVENT"
            ? Number(s.eventId) === Number(contextId)
            : Number(s.serviceId) === Number(contextId)),
      );

      if (!schedule) {
        const payload = {
          date: selectedDate.toISOString(),
          type: contextType,
          eventId: contextType === "EVENT" ? Number(contextId) : null,
          serviceId: contextType === "SERVICE" ? Number(contextId) : null,
        };

        const res = await apiRequest("POST", "/api/schedules", payload);
        if (!res.ok) throw new Error("Falha ao criar agenda base");
        schedule = await res.json();
      }

      if (!schedule) throw new Error("Falha ao obter escala");

      // 2. Assign Users
      const promises = draftTeam.map((user) => {
        return apiRequest("POST", `/api/schedules/${schedule!.id}/assign`, {
          userId: user.id,
          ministryId: Number(selectedMinistryId),
          functionId: user.functionId ? Number(user.functionId) : null,
          status: "pending",
        });
      });

      await Promise.all(promises);

      // 3. Prepare Share Data
      const contextName =
        contextType === "EVENT"
          ? events?.find((e) => String(e.id) === contextId)?.name
          : services?.find((s) => String(s.id) === contextId)?.name;

      const ministryName = ministries?.find(
        (m) => String(m.id) === selectedMinistryId,
      )?.name;

      setLastPublishedData({
        title: contextName,
        date: format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR }),
        ministry: ministryName,
        team: draftTeam,
      });

      setDraftTeam([]);
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowShareDialog(true); // Abre o modal de compartilhamento
    } catch (error: any) {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // --- SHARE HELPERS ---
  const handleShareWhatsApp = () => {
    if (!lastPublishedData) return;

    let message = `*ESCALA - ${lastPublishedData.title.toUpperCase()}*n`;
    message += `📅 ${lastPublishedData.date}n`;
    message += `🎸 Ministério: ${lastPublishedData.ministry}nn`;
    message += `*EQUIPE ESCALADA:*n`;

    lastPublishedData.team.forEach((user: any) => {
      message += `✅ ${user.name} ${user.functionName ? `(${user.functionName})` : ""}n`;
    });

    message += `n_Gerado via Ecclesia Online_`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-all">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* PAGE HEADER */}
        <header className="flex flex-col gap-2 print:hidden">
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
            Escalas <span className="text-primary">Master</span>
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Gestão inteligente de equipes e
            liturgia.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            <Card className="p-6 border-none rounded-[2.5rem] bg-card/50 backdrop-blur-sm shadow-xl ring-1 ring-white/10">
              {/* SELECTORS */}
              <div className="space-y-6 mb-8">
                {/* 1. CONTEXT SELECTOR (Aesthetic) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">
                    1. Contexto da Escala
                  </label>
                  <Select onValueChange={handleContextChange}>
                    <SelectTrigger className="h-16 rounded-2xl bg-muted/40 border-none font-bold text-lg hover:bg-muted/60 transition-colors">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
                      <div className="px-4 py-2 text-[10px] font-black uppercase text-indigo-500 tracking-wider bg-indigo-500/5 mb-1">
                        Cultos Semanais
                      </div>
                      {services?.map((s) => (
                        <SelectItem
                          key={`SERVICE:${s.id}`}
                          value={`SERVICE:${s.id}`}
                          className="py-3 px-4 font-bold cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span>{s.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                {DAYS_MAP[s.dayOfWeek]} às {s.time}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                      <div className="px-4 py-2 text-[10px] font-black uppercase text-amber-500 tracking-wider bg-amber-500/5 mt-2 mb-1">
                        Eventos Especiais
                      </div>
                      {events?.map((e) => (
                        <SelectItem
                          key={`EVENT:${e.id}`}
                          value={`EVENT:${e.id}`}
                          className="py-3 px-4 font-bold cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                              <CalendarIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span>{e.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                {format(new Date(e.date), "dd/MM/yy")} às{" "}
                                {e.time}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. DATE PICKER (Smart) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">
                    2. Data da Escala
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        disabled={contextType === "EVENT" && !!selectedDate} // Lock if Event
                        variant={"outline"}
                        className={cn(
                          "w-full h-14 justify-start text-left font-bold text-lg rounded-2xl border-none bg-muted/40 hover:bg-muted/60 disabled:opacity-100 disabled:bg-amber-500/10 disabled:text-amber-700",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 opacity-50" />
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-[1.5rem] shadow-2xl border-none"
                      align="start"
                    >
                      <div className="p-4 bg-primary text-primary-foreground">
                        <p className="font-bold text-sm">Escolha o dia</p>
                        <p className="text-xs opacity-70">
                          {contextType === "SERVICE"
                            ? "Apenas dias do culto."
                            : "Selecione a data."}
                        </p>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={isDateDisabled}
                        initialFocus
                        className="p-3 bg-card"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 3. MINISTRY SELECTOR */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">
                    3. Equipe Responsável
                  </label>
                  <Select
                    value={selectedMinistryId}
                    onValueChange={setSelectedMinistryId}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/40 border-none font-bold text-lg">
                      <SelectValue placeholder="Ministério..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {ministries?.map((m) => (
                        <SelectItem
                          key={m.id}
                          value={String(m.id)}
                          className="py-3 font-bold"
                        >
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CANDIDATE SELECTION TABS */}
              <Tabs defaultValue="available" className="w-full">
                <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-2xl h-14 mb-4">
                  <TabsTrigger
                    value="available"
                    className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                  >
                    DISPONÍVEIS ({availableCandidates.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="unavailable"
                    className="rounded-xl font-black data-[state=active]:bg-muted-foreground/20 transition-all"
                  >
                    OCUPADOS ({unavailableCandidates.length})
                  </TabsTrigger>
                </TabsList>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background/50 border-none"
                  />
                </div>

                <TabsContent
                  value="available"
                  className="space-y-4 outline-none"
                >
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="grid grid-cols-1 gap-2">
                      {selectedMinistryId && selectedDate ? (
                        availableCandidates.length > 0 ? (
                          availableCandidates.map((member) => (
                            <button
                              key={member.id}
                              onClick={() =>
                                setDraftTeam([...draftTeam, member])
                              }
                              className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group w-full text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                  {member.name?.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">
                                    {member.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {member.functionName || "Membro Geral"}
                                  </span>
                                </div>
                              </div>
                              <PlusBadge />
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-10 opacity-50">
                            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-bold">
                              Nenhum voluntário disponível.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-10 opacity-50">
                          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-bold">
                            Preencha o passo 1 e 2.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* AUTO GENERATE TOOL */}
                  {selectedMinistryId && selectedDate && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-primary flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Auto-Escalar
                          </span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={targetCount}
                              onChange={(e) =>
                                setTargetCount(Number(e.target.value))
                              }
                              className="w-16 h-8 text-center font-bold bg-background rounded-lg border-none"
                            />
                            <span className="text-[10px] font-bold opacity-60">
                              PESSOAS
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAutoGenerate}
                          className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                        >
                          Sortear Voluntários
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="unavailable" className="outline-none">
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="grid grid-cols-1 gap-2">
                      {unavailableCandidates.length > 0 ? (
                        unavailableCandidates.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent opacity-70 w-full text-left cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">
                                {member.name?.substring(0, 2)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-muted-foreground line-through decoration-rose-500/50">
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> {member.reason}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 opacity-50">
                          <Check className="w-10 h-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                          <p className="text-xs font-bold">
                            Todos estão disponíveis!
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* RIGHT PANEL: DRAFT & PUBLISH */}
          <div className="lg:col-span-7 space-y-6 print:w-full print:col-span-12">
            <div className="bg-card border-2 border-dashed border-border rounded-[3rem] p-8 min-h-[500px] flex flex-col relative overflow-hidden print:border-none print:shadow-none">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] print:hidden">
                <Users size={200} />
              </div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black uppercase italic flex items-center gap-3">
                    <Check className="w-6 h-6 text-primary" /> Rascunho da
                    Escala
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {draftTeam.length} pessoas selecionadas.
                  </p>
                </div>
                {draftTeam.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setDraftTeam([])}
                    className="text-destructive font-bold uppercase text-xs hover:bg-destructive/10 print:hidden"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* DRAFT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start relative z-10">
                <AnimatePresence mode="popLayout">
                  {draftTeam.map((u) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={u.id}
                      className="flex items-center justify-between p-4 bg-background rounded-[1.5rem] shadow-sm border border-border group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black">
                          {u.name.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm">{u.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {u.functionName || "Apoio"}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive print:hidden"
                        onClick={() =>
                          setDraftTeam(
                            draftTeam.filter((item) => item.id !== u.id),
                          )
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {draftTeam.length === 0 && (
                  <div className="col-span-full h-full flex flex-col items-center justify-center opacity-40">
                    <UserPlus className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-bold text-lg">
                      Adicione voluntários à esquerda
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-8 mt-auto relative z-10 print:hidden">
                <Button
                  disabled={draftTeam.length === 0}
                  onClick={publishSchedule}
                  className="w-full h-20 rounded-[2rem] bg-foreground text-background font-black text-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl flex items-center justify-center gap-4"
                >
                  <CalendarDays className="w-6 h-6" />
                  PUBLICAR AGORA
                </Button>
              </div>
            </div>

            {/* HISTORY */}
            <div className="p-6 bg-muted/20 rounded-[2.5rem] print:hidden">
              <h4 className="text-sm font-black uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Últimas Publicações
              </h4>
              <div className="space-y-2">
                {allSchedules?.slice(0, 3).map((sched: any) => (
                  <div
                    key={sched.id}
                    className="flex items-center justify-between p-3 bg-background rounded-xl text-sm border border-border/50"
                  >
                    <span className="font-bold">
                      {sched.event?.name || sched.service?.name || "Escala"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sched.date), "dd/MM", {
                          locale: ptBR,
                        })}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {sched.assignments?.length || 0} Pax
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DIALOG DE COMPARTILHAMENTO */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none bg-card p-0 overflow-hidden">
            <div className="p-8 bg-emerald-600 text-white text-center relative overflow-hidden">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-500/20 rotate-45 pointer-events-none" />
              <Check className="w-16 h-16 mx-auto mb-4 bg-white/20 p-3 rounded-full relative z-10" />
              <DialogTitle className="text-3xl font-black uppercase relative z-10">
                Escala Publicada!
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium relative z-10 mt-2">
                A equipe foi notificada. Compartilhe agora com o grupo.
              </DialogDescription>
            </div>

            <div className="p-8 space-y-4">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg gap-3 shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-6 h-6" /> Enviar no WhatsApp
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="h-12 rounded-xl font-bold gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Imprimir / PDF
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowShareDialog(false)}
                  className="h-12 rounded-xl font-bold"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function PlusBadge() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
      <PlusIcon className="w-4 h-4" />
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
