import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useLocations, useCreateLocation } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Locations() {
  const { data: locations, isLoading } = useLocations();
  const { mutate: createLocation, isPending } = useCreateLocation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation(
      { name, address, capacity: capacity ? parseInt(capacity) : undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setAddress("");
          setCapacity("");
          toast({ title: "Local criado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao criar local", variant: "destructive" });
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
            <h1 className="text-3xl font-bold font-display text-foreground">Locais</h1>
            <p className="text-muted-foreground mt-1">Salas e espaços da igreja.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Local
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Local</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Local</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Salão Principal" required />
                </div>
                <div className="space-y-2">
                  <Label>Endereço / Localização</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Bloco A, 1º Andar" />
                </div>
                <div className="space-y-2">
                  <Label>Capacidade</Label>
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ex: 200" />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar Local"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : locations && locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{loc.name}</h3>
                    {loc.capacity && (
                      <span className="text-xs text-muted-foreground">{loc.capacity} pessoas</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{loc.address || "Sem endereço especificado"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum local cadastrado.</p>
          </div>
        )}
      </main>
    </div>
  );
}
