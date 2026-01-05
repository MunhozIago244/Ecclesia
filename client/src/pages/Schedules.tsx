import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSchedules, useCreateSchedule, useServices, useEvents } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Schedules() {
  const { data: schedules, isLoading } = useSchedules();
  const { data: services } = useServices();
  const { data: events } = useEvents();
  const { mutate: createSchedule, isPending } = useCreateSchedule();
  
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [type, setType] = useState<"SERVICE" | "EVENT">("SERVICE");
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSchedule(
      {
        type,
        date: new Date(date).toISOString(),
        serviceId: type === "SERVICE" ? parseInt(selectedId) : undefined,
        eventId: type === "EVENT" ? parseInt(selectedId) : undefined,
        name: name || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          toast({ title: "Escala criada com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao criar escala", variant: "destructive" });
        },
      }
    );
  };

  const resetForm = () => {
    setType("SERVICE");
    setSelectedId("");
    setDate("");
    setName("");
  };

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Escalas</h1>
            <p className="text-muted-foreground mt-1">Organize os voluntários para cada culto.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nova Escala
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Escala</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v: "SERVICE" | "EVENT") => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Culto</SelectItem>
                      <SelectItem value="EVENT">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Selecione</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {type === "SERVICE" 
                        ? services?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                        : events?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Nome Personalizado (Opcional)</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Culto Especial de Natal" />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Criando..." : "Criar Escala"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id} 
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {schedule.name || (schedule.type === "SERVICE" ? "Culto Regular" : "Evento")}
                    </h3>
                    <p className="text-muted-foreground">
                      {format(new Date(schedule.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-medium">
                        {schedule.type === "SERVICE" ? "Culto" : "Evento"}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-medium">
                        {schedule.assignments.length} escalados
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Ver Detalhes</Button>
                  <Button size="sm">Gerenciar Escala</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhuma escala criada ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
