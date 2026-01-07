"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents, useCreateSchedule, useSchedules } from "@/hooks/use-schedules";
import { useMinistries } from "@/hooks/use-ministries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Users, Search, X, Check,
  CalendarDays, History, UserPlus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

export default function AdminSchedules() {
  const { data: events } = useEvents();
  const { data: ministries } = useMinistries();
  const { data: allSchedules } = useSchedules();
  const { mutate: createSchedule } = useCreateSchedule();
  const { toast } = useToast();

  const { data: allUsers, isLoading: loadingUsers } = useQuery<any[]>({ 
    queryKey: ["/api/admin/users"] 
  });

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [targetCount, setTargetCount] = useState<number>(3);
  const [draftTeam, setDraftTeam] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const availableCandidates = useMemo(() => {
    // Se não selecionou ministério, não mostra ninguém para evitar confusão
    if (!selectedMinistryId || !allUsers) return [];
    
    const mId = Number(selectedMinistryId);

    return allUsers.filter(user => {
      // 1. Detecção Flexível de Ministério (procura em vários campos possíveis)
      const isMember = 
        Number(user.ministryId) === mId || 
        user.ministries?.some((m: any) => Number(m.id) === mId) ||
        user.userMinistries?.some((um: any) => Number(um.ministryId) === mId) ||
        user.ministry?.id === mId; // Caso venha como objeto único

      if (!isMember) return false;

      // 2. Verifica se já está no rascunho atual
      const inDraft = draftTeam.some(d => d.id === user.id);
      if (inDraft) return false;

      // 3. Verifica se já está escalado (opcional: comente as linhas abaixo se quiser permitir duplicatas)
      const isAlreadyScheduled = allSchedules?.some(s => 
        Number(s.eventId) === Number(selectedEventId) && 
        Number(s.userId) === Number(user.id)
      );

      return !isAlreadyScheduled;
    });
  }, [selectedMinistryId, allUsers, selectedEventId, allSchedules, draftTeam]);

  // LOG DE DEPURAÇÃO (Pressione F12 no navegador para ver)
  console.log("Usuários Totais:", allUsers?.length);
  console.log("Candidatos Disponíveis:", availableCandidates.length);
  console.log("ID do Ministério Selecionado:", selectedMinistryId);

  // --- SORTEIO AUTOMÁTICO CORRIGIDO ---
  const handleAutoGenerate = () => {
    if (!selectedEventId || !selectedMinistryId) {
      return toast({ title: "Atenção", description: "Selecione evento e ministério primeiro", variant: "destructive" });
    }

    if (availableCandidates.length === 0) {
      return toast({ title: "Indisponível", description: "Não há voluntários disponíveis para sorteio.", variant: "destructive" });
    }

    // Embaralha e pega apenas a quantidade necessária para preencher as vagas
    const shuffled = [...availableCandidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);
    
    setDraftTeam(prev => [...prev, ...selected]);
    toast({ title: "Equipe Sorteada!", description: `${selected.length} voluntários adicionados.` });
  };

  const publishSchedule = () => {
    if (draftTeam.length === 0) return;

    draftTeam.forEach(user => {
      // @ts-ignore
      createSchedule({
        eventId: Number(selectedEventId),
        ministryId: Number(selectedMinistryId),
        userId: user.id,
        status: "pendente"
      });
    });
    
    setDraftTeam([]);
    toast({ title: "Escala publicada!", description: "Os voluntários receberam notificações." });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-all">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        
        <header className="flex flex-col gap-2">
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
            EQUIPE <span className="text-primary">MASTER</span>
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Monte escalas em segundos com auxílio de sorteio inteligente.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PAINEL DE CONTROLE (ESQUERDA) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 border-none rounded-[2.5rem] bg-card/50 backdrop-blur-sm shadow-2xl ring-1 ring-white/10">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">Culto ou Evento</label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/40 border-none font-bold text-lg">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {events?.map(e => (
                          <SelectItem key={e.id} value={String(e.id)} className="py-3 font-bold">
                            {e.name} — {format(new Date(e.date), "dd/MM", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">Ministério</label>
                    <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/40 border-none font-bold text-lg">
                        <SelectValue placeholder="Escolha a equipe..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {ministries?.map(m => (
                          <SelectItem key={m.id} value={String(m.id)} className="py-3 font-bold">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-2xl h-14 mb-6">
                    <TabsTrigger value="manual" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white">MANUAL</TabsTrigger>
                    <TabsTrigger value="auto" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white">INTELIGENTE</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4 outline-none">
                    
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                        {availableCandidates.length > 0 ? (
                            availableCandidates.map(user => (
                            <button
                                key={user.id}
                                onClick={() => setDraftTeam([...draftTeam, user])}
                                className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group w-full text-left"
                            >
                                <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                    {user.name?.substring(0, 2)}
                                </div>
                                <span className="font-bold text-sm">{user.name}</span>
                                </div>
                                
                                {/* Ícone de Plus mais visível no Hover */}
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                <Plus className="w-5 h-5" />
                                </div>
                            </button>
                            ))
                        ) : (
                            /* Estado Vazio Amigável */
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                            <Users className="w-12 h-12 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-tighter italic">
                                {selectedMinistryId 
                                ? "Todos os membros deste ministério já foram selecionados ou escalados." 
                                : "Selecione um ministério para ver os voluntários."}
                            </p>
                            </div>
                        )}
                        </div>
                    </div>
                    </TabsContent>

                  <TabsContent value="auto" className="space-y-6 outline-none">
                    <div className="p-6 bg-primary/10 rounded-[2rem] border border-primary/20 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black uppercase text-primary">Preencher Vagas</span>
                        <span className="text-3xl font-black text-primary">{targetCount}</span>
                      </div>
                      <Input 
                        type="range" min="1" max="15" 
                        value={targetCount} 
                        onChange={(e) => setTargetCount(Number(e.target.value))} 
                        className="accent-primary h-2" 
                      />
                      <Button onClick={handleAutoGenerate} className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 shadow-lg shadow-primary/30 transition-all active:scale-95">
                        SORTEAR AGORA <Sparkles className="w-5 h-5" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            <Button 
              disabled={draftTeam.length === 0} 
              onClick={publishSchedule} 
              className="w-full h-24 rounded-[2.5rem] bg-foreground text-background font-black text-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex flex-col gap-0"
            >
              <span>PUBLICAR ESCALA</span>
              <span className="text-[10px] opacity-60 font-medium uppercase tracking-widest">
                {draftTeam.length} voluntários selecionados
              </span>
            </Button>
          </div>

          {/* PREVIEW DA EQUIPE (DIREITA) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Users size={120} />
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <h3 className="text-2xl font-black uppercase italic flex items-center gap-3">
                  <Check className="w-6 h-6 text-primary" /> No Rascunho
                </h3>
                {draftTeam.length > 0 && (
                  <Button variant="link" onClick={() => setDraftTeam([])} className="text-destructive font-bold uppercase text-xs">Remover todos</Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {draftTeam.map((u) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, x: -20 }} 
                      key={u.id} 
                      className="flex items-center justify-between p-5 bg-card rounded-[1.5rem] shadow-xl border border-white/5 group"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-lg">{u.name}</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">Confirmado no Rascunho</span>
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setDraftTeam(draftTeam.filter(item => item.id !== u.id))}>
                        <X className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {draftTeam.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-muted/5 rounded-[2rem] border border-dashed border-muted">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-bold italic">Sua equipe de rascunho está vazia.</p>
                  </div>
                )}
              </div>
            </div>

            {/* HISTÓRICO COMPACTO */}
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-3 opacity-70">
                <History className="w-5 h-5 text-primary" /> Últimas Escalas
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {allSchedules?.slice(0, 5).map((sched: any) => (
                  <div key={sched.id} className="p-4 bg-card/40 rounded-2xl border border-border flex items-center justify-between hover:bg-card transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                        {sched.user?.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm">{sched.user?.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{sched.event?.name} • {sched.ministry?.name}</p>
                      </div>
                    </div>
                    <Badge status={sched.status} />
                  </div>
                ))}
              </div>
            </div>

          </div>
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
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}