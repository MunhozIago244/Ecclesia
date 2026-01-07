"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, Calendar as CalendarIcon, 
  Clock, Edit3, Loader2, 
  Church, AlertTriangle, CalendarRange
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo" }, { id: 1, label: "Segunda-feira" }, { id: 2, label: "Terça-feira" },
  { id: 3, label: "Quarta-feira" }, { id: 4, label: "Quinta-feira" }, { id: 5, label: "Sexta-feira" },
  { id: 6, label: "Sábado" },
];

export default function AdminEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"events" | "services">("events");
  
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Estados do Formulário
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(""); 
  const [dayOfWeek, setDayOfWeek] = useState<string>("0");
  const [recurrenceType, setRecurrenceType] = useState<"WEEKLY" | "INTERVAL" | "MONTHLY">("WEEKLY");
  const [intervalWeeks, setIntervalWeeks] = useState("1");
  const [monthlyWeeks, setMonthlyWeeks] = useState<string[]>([]);

  const { data: events, isLoading: loadingEvents } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const { data: services, isLoading: loadingServices } = useQuery<any[]>({ queryKey: ["/api/services"] });

  const resetForm = () => {
    setName(""); setTime(""); setDate(""); setDayOfWeek("0");
    setRecurrenceType("WEEKLY"); setIntervalWeeks("1"); setMonthlyWeeks([]);
    setEditingItem(null);
  };

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || "");
      setTime(editingItem.time || "");
      
      if (activeTab === "events") {
        if (editingItem.date) {
          // Extrai YYYY-MM-DD com segurança
          setDate(new Date(editingItem.date).toISOString().split('T')[0]);
        }
      } else {
        setDayOfWeek(String(editingItem.dayOfWeek ?? "0"));
        setRecurrenceType(editingItem.recurrenceType || "WEEKLY");
        setIntervalWeeks(String(editingItem.intervalWeeks || "1"));
        setMonthlyWeeks(editingItem.monthlyWeeks ? editingItem.monthlyWeeks.split(",") : []);
      }
    } else {
      resetForm();
    }
  }, [editingItem, isUpsertOpen, activeTab]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const method = editingItem ? "PATCH" : "POST";
      const endpoint = activeTab === "events" ? "/api/events" : "/api/services";
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
      return await apiRequest(method, url, payload);
    },
    onSuccess: () => {
      // Invalida ambas as listas para garantir atualização visual
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsUpsertOpen(false);
      resetForm();
      toast({ title: `Agenda ${editingItem ? 'atualizada' : 'criada'} com sucesso!` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "events") {
      // Cria a data usando o fuso local para evitar o bug de "um dia antes"
      const [year, month, day] = date.split('-').map(Number);
      const dateObject = new Date(year, month - 1, day, 12, 0, 0);

      upsertMutation.mutate({
        name,
        time,
        date: dateObject,
      });
    } else {
      upsertMutation.mutate({
        name,
        time,
        dayOfWeek: parseInt(dayOfWeek),
        recurrenceType,
        intervalWeeks: recurrenceType === "INTERVAL" ? parseInt(intervalWeeks) : 1,
        monthlyWeeks: recurrenceType === "MONTHLY" ? monthlyWeeks.sort().join(",") : null,
        isActive: true
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/${itemToDelete.type}/${itemToDelete.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${itemToDelete.type}`] });
      setIsDeleteOpen(false);
      setItemToDelete(null);
      toast({ title: "Removido com sucesso" });
    }
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">Agenda <span className="text-indigo-500">Master</span></h1>
            <p className="text-muted-foreground font-medium">Gestão unificada de eventos e liturgia.</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsUpsertOpen(true); }}
            className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {activeTab === "events" ? "Novo Evento" : "Novo Culto Base"}
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8 border border-border">
            <TabsTrigger value="events" className="rounded-xl px-8 font-bold">Eventos Especiais</TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl px-8 font-bold">Cultos Recorrentes</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingEvents && <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>}
            {events?.map(event => (
              <AdminCard 
                key={event.id} 
                item={event} 
                type="events" 
                onEdit={() => { setEditingItem(event); setIsUpsertOpen(true); }} 
                onDelete={() => { setItemToDelete({ ...event, type: 'events' }); setIsDeleteOpen(true); }} 
              />
            ))}
          </TabsContent>

          <TabsContent value="services" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingServices && <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>}
            {services?.map(service => (
              <AdminCard 
                key={service.id} 
                item={service} 
                type="services" 
                onEdit={() => { setEditingItem(service); setIsUpsertOpen(true); }} 
                onDelete={() => { setItemToDelete({ ...service, type: 'services' }); setIsDeleteOpen(true); }} 
              />
            ))}
          </TabsContent>
        </Tabs>

        {/* MODAL DE EDIÇÃO / CRIAÇÃO */}
        <Dialog open={isUpsertOpen} onOpenChange={(open) => { setIsUpsertOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="max-w-md bg-card border-border rounded-[2.5rem] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {editingItem ? "Editar " : "Cadastrar "} 
                {activeTab === "events" ? "Evento" : "Culto"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para atualizar a agenda da igreja.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-500">Nome Identificador</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-12 bg-background font-bold" required placeholder="Ex: Culto de Jovens" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {activeTab === "events" ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Data Fixa</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-12 bg-background font-bold" required />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Dia da Semana</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger className="rounded-xl h-12 bg-background font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(day => <SelectItem key={day.id} value={String(day.id)}>{day.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Horário</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl h-12 bg-background font-bold" required />
                </div>
              </div>

              {activeTab === "services" && (
                <div className="space-y-4 p-5 bg-muted/30 rounded-[2rem] border border-border">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Regra de Recorrência</Label>
                  <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                    <SelectTrigger className="rounded-xl bg-background h-11 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY" className="font-bold">Toda Semana</SelectItem>
                      <SelectItem value="INTERVAL" className="font-bold">Intervalo (Quinzenal/etc)</SelectItem>
                      <SelectItem value="MONTHLY" className="font-bold">Semanas Específicas</SelectItem>
                    </SelectContent>
                  </Select>

                  {recurrenceType === "INTERVAL" && (
                    <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
                      <span className="text-sm font-bold">A cada</span>
                      <Input type="number" className="w-16 h-9 font-black text-center" value={intervalWeeks} onChange={(e) => setIntervalWeeks(e.target.value)} min="1" />
                      <span className="text-sm font-bold text-muted-foreground">semanas</span>
                    </div>
                  )}

                  {recurrenceType === "MONTHLY" && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase">Semanas do mês:</Label>
                      <ToggleGroup type="multiple" value={monthlyWeeks} onValueChange={setMonthlyWeeks} className="justify-between gap-1">
                        {["1", "2", "3", "4", "5"].map(w => (
                          <ToggleGroupItem key={w} value={w} className="w-11 h-11 rounded-xl border-2 data-[state=on]:bg-indigo-600 data-[state=on]:text-white font-black">
                            {w}ª
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="animate-spin" /> : editingItem ? "Salvar Alterações" : "Criar Agenda"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* ALERTA DE EXCLUSÃO */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader className="items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="text-rose-500 w-8 h-8" />
              </div>
              <AlertDialogTitle className="text-2xl font-black">Remover Agenda?</AlertDialogTitle>
              <AlertDialogDescription className="text-lg">
                Isso excluirá permanentemente <span className="font-bold text-foreground italic">"{itemToDelete?.name}"</span> e todas as suas escalas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-2">
              <AlertDialogCancel className="rounded-xl font-bold h-12">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                disabled={deleteMutation.isPending}
                onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }} 
                className="rounded-xl bg-rose-500 hover:bg-rose-600 font-bold h-12 px-8"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function AdminCard({ item, type, onEdit, onDelete }: any) {
  const isEvent = type === 'events';
  
  const getFormattedDate = () => {
    try {
      if (isEvent && item.date) {
        return format(parseISO(item.date), "dd/MM/yyyy", { locale: ptBR });
      }
      return DAYS_OF_WEEK[item.dayOfWeek]?.label || "Dia não definido";
    } catch (e) {
      return "Data inválida";
    }
  };

  return (
    <div className="group bg-card border border-border rounded-[2rem] p-5 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", isEvent ? "bg-amber-500/10 text-amber-600" : "bg-indigo-500/10 text-indigo-600")}>
          {isEvent ? <CalendarIcon className="w-5 h-5" /> : <Church className="w-5 h-5" />}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-lg h-9 w-9"><Edit3 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="rounded-lg h-9 w-9 hover:text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      
      <h3 className="font-black text-xl mb-2 line-clamp-1">{item.name}</h3>
      
      <div className="space-y-2 text-sm font-bold text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" /> 
          {item.time}
        </div>
        <div className="flex items-center gap-2">
          {isEvent ? <CalendarIcon className="w-4 h-4 text-amber-400" /> : <CalendarRange className="w-4 h-4 text-indigo-400" />}
          {getFormattedDate()}
        </div>
        {!isEvent && (
          <Badge variant="secondary" className="bg-indigo-500/5 text-indigo-500 border-none font-black text-[10px] uppercase">
            {item.recurrenceType === "WEEKLY" ? "Toda Semana" : 
             item.recurrenceType === "MONTHLY" ? "Semanas Específicas" : "Intervalo"}
          </Badge>
        )}
      </div>
    </div>
  );
}