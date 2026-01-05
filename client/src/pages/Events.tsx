import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEvents, useCreateEvent } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Events() {
  const { data: events, isLoading } = useEvents();
  const { mutate: createEvent, isPending } = useCreateEvent();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent(
      { 
        name, 
        date: new Date(date).toISOString(), 
        time, 
        description 
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDate("");
          setTime("");
          setDescription("");
          toast({ title: "Evento criado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao criar evento", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Eventos</h1>
            <p className="text-muted-foreground mt-1">Calendário de atividades especiais.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Evento</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Criando..." : "Criar Evento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-2 bg-gradient-to-r from-primary to-purple-500" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-primary uppercase">
                        {format(new Date(event.date), 'MMM', { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-bold font-display text-foreground leading-none">
                        {format(new Date(event.date), 'dd')}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description || "Sem descrição."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum evento programado.</p>
          </div>
        )}
      </main>
    </div>
  );
}
