"use client";

import { useState, useEffect} from "react";
import { Sidebar } from "@/components/Sidebar";
import { useServices, useCreateService } from "@/hooks/use-schedules";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Plus, Clock, RefreshCcw, Loader2, Church, 
  CalendarDays, Settings2, CalendarRange, X 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

// Parâmetros extraídos do Dashboard
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda-feira" },
  { id: 2, label: "Terça-feira" },
  { id: 3, label: "Quarta-feira" },
  { id: 4, label: "Quinta-feira" },
  { id: 5, label: "Sexta-feira" },
  { id: 6, label: "Sábado" },
];

export default function Services() {
  const { user: currentUser } = useAuth();
  const { data: services, isLoading, error, refetch } = useServices();
  const { mutate: createService, isPending } = useCreateService();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("0");
  const [recurrenceType, setRecurrenceType] = useState<"WEEKLY" | "INTERVAL" | "MONTHLY">("WEEKLY");
  const [intervalWeeks, setIntervalWeeks] = useState("1");
  const [monthlyWeeks, setMonthlyWeeks] = useState<string[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);

  // Permissões
  const isAdmin = currentUser?.role === "admin";
  const canManage = isAdmin || currentUser?.role === "leader";

  // Sincronização de Erros
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro de sincronização",
        description: "Não foi possível carregar os cultos base.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      time,
      dayOfWeek: parseInt(dayOfWeek),
      recurrenceType,
      intervalWeeks: recurrenceType === "INTERVAL" ? parseInt(intervalWeeks) : 1,
      monthlyWeeks: recurrenceType === "MONTHLY" ? monthlyWeeks.join(",") : null,
      isActive: true,
      locationId: locationId ? parseInt(locationId) : null,
      startDate: new Date(), 
    };

    createService(payload, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
        toast({ title: "Culto base configurado!" });
        refetch();
      },
      onError: (err: any) => {
        toast({ 
          title: "Erro ao salvar", 
          description: err.message || "Verifique os dados e tente novamente.",
          variant: "destructive" 
        });
      }
    });
  };

  const resetForm = () => {
    setName(""); setTime(""); setDayOfWeek("0");
    setRecurrenceType("WEEKLY"); setIntervalWeeks("1"); setMonthlyWeeks([]);
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        
        {/* HEADER - Parâmetros: opacity: 0, x: -20 */}
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
              <Settings2 className="w-4 h-4" />
              Configurações do Sistema
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Cultos <span className="text-indigo-500">Base</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Defina os dias e frequências para geração automática de escalas.
            </p>
          </div>

          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 gap-2 active:scale-95 transition-all">
                  <Plus className="w-5 h-5" /> Novo Culto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Cadastrar Culto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  {/* ... campos do formulário (mantidos iguais) ... */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nome do Culto</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-background border-border h-12" placeholder="Ex: Culto de Celebração" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Dia da Semana</Label>
                      <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger className="rounded-xl bg-background border-border h-12 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          {DAYS_OF_WEEK.map((day) => <SelectItem key={day.id} value={String(day.id)}>{day.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Horário</Label>
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl bg-background border-border h-12 font-bold" required />
                    </div>
                  </div>

                  <div className="space-y-3 p-5 bg-muted/30 rounded-[2rem] border border-border">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Regra de Frequência</Label>
                    <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                      <SelectTrigger className="rounded-xl bg-background border-border h-11 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="WEEKLY" className="font-bold">Toda Semana</SelectItem>
                        <SelectItem value="INTERVAL" className="font-bold">Intervalo (Quinzenal/etc)</SelectItem>
                        <SelectItem value="MONTHLY" className="font-bold">Semanas do Mês</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* AnimatePresence para os campos condicionais do formulário */}
                    <AnimatePresence mode="wait">
                      {recurrenceType === "INTERVAL" && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: "auto" }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 mt-4 p-3 bg-background rounded-xl border border-border overflow-hidden"
                        >
                          <span className="text-sm font-bold">Repete a cada</span>
                          <Input type="number" className="w-16 h-9 rounded-lg font-black text-center" value={intervalWeeks} onChange={(e) => setIntervalWeeks(e.target.value)} min="1" />
                          <span className="text-sm font-bold text-muted-foreground">semanas</span>
                        </motion.div>
                      )}

                      {recurrenceType === "MONTHLY" && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: "auto" }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3 overflow-hidden"
                        >
                          <Label className="text-[10px] font-black text-muted-foreground uppercase">Quais semanas do mês?</Label>
                          <ToggleGroup type="multiple" value={monthlyWeeks} onValueChange={setMonthlyWeeks} className="justify-between gap-1">
                            {["1", "2", "3", "4", "5"].map((w) => (
                              <ToggleGroupItem key={w} value={w} className="w-11 h-11 rounded-xl border-border border-2 data-[state=on]:bg-indigo-600 data-[state=on]:text-white font-black">
                                {w}ª
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : "Salvar Configuração"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.header>

        {/* LISTA DE CULTOS - Parâmetros: containerVariants (staggerChildren: 0.1) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full rounded-[2rem]" />
            <Skeleton className="h-48 w-full rounded-[2rem]" />
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services?.map((service) => (
              <motion.div 
                key={service.id} 
                variants={itemVariants} // Parâmetros: y: 20 -> 0
                whileHover={{ y: -5 }}  // Parâmetro de interação: y: -5
                whileTap={{ scale: 0.98 }}
                className="group bg-card border border-border rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Elementos visuais internos */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[4rem] group-hover:bg-indigo-500/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <Church className="w-6 h-6" />
                  </div>
                  
                  <Badge className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                    service.recurrenceType === "WEEKLY" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {service.recurrenceType === "WEEKLY" ? "Semanal" : "Personalizado"}
                  </Badge>
                </div>
                
                <div className="mt-6 relative z-10">
                  <h3 className="text-2xl font-black text-foreground group-hover:text-indigo-500 transition-colors">
                    {service.name}
                  </h3>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-foreground bg-muted/40 p-3 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border">
                        <CalendarRange className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span>{DAYS_OF_WEEK[service.dayOfWeek]?.label} às {service.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground p-1 ml-1">
                      <RefreshCcw className={cn("w-4 h-4", service.recurrenceType !== "WEEKLY" && "text-indigo-500")} />
                      <span className="leading-relaxed">
                        {service.recurrenceType === "WEEKLY" && "Ocorre todas as semanas"}
                        {service.recurrenceType === "INTERVAL" && `A cada ${service.intervalWeeks ?? 1} semanas`}
                        {service.recurrenceType === "MONTHLY" && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="mr-1">Nas</span>
                            {service.monthlyWeeks?.split(',').map((w: string) => (
                              <Badge key={w} variant="outline" className="text-[10px] h-5 border-indigo-500/30 text-indigo-500 bg-indigo-500/5 font-black">
                                {w}ª
                              </Badge>
                            ))}
                            <span className="ml-1">{DAYS_OF_WEEK[service.dayOfWeek]?.label}s do mês</span>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {services?.length === 0 && (
              <motion.div 
                variants={itemVariants}
                className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[3rem] bg-card/50"
              >
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-6" />
                <p className="text-xl font-bold text-muted-foreground text-center">Nenhum culto base configurado.</p>
                {canManage && (
                  <Button onClick={() => setOpen(true)} variant="ghost" className="text-indigo-500 font-bold mt-2">
                    Configurar agora
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}