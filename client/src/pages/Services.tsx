import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useServices, useCreateService } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import { Plus, Church, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Services() {
  const { data: services, isLoading } = useServices();
  const { mutate: createService, isPending } = useCreateService();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createService(
      { name, dayOfWeek, time },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDayOfWeek("");
          setTime("");
          toast({ title: "Culto cadastrado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao cadastrar culto", variant: "destructive" });
        },
      }
    );
  };

  const days = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
    "Quinta-feira", "Sexta-feira", "Sábado"
  ];

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Cultos</h1>
            <p className="text-muted-foreground mt-1">Gerencie os horários fixos de celebração.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Culto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Culto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Culto</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ex: Culto de Celebração"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Dia da Semana</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={time} 
                      onChange={(e) => setTime(e.target.value)} 
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar Culto"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Church className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                    Semanal
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-foreground">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.dayOfWeek} às {service.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum culto cadastrado ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
