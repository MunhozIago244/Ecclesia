import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useEquipments, useCreateEquipment, useLocations } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Plus, Mic2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Equipments() {
  const { data: equipments, isLoading } = useEquipments();
  const { data: locations } = useLocations();
  const { mutate: createEquipment, isPending } = useCreateEquipment();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("audio");
  const [locationId, setLocationId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEquipment(
      { 
        name, 
        category, 
        status: "disponivel",
        locationId: locationId ? parseInt(locationId) : undefined 
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setCategory("audio");
          setLocationId("");
          toast({ title: "Equipamento cadastrado!" });
        },
        onError: () => {
          toast({ title: "Erro ao cadastrar", variant: "destructive" });
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
            <h1 className="text-3xl font-bold font-display text-foreground">Equipamentos</h1>
            <p className="text-muted-foreground mt-1">Inventário de recursos técnicos.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Equipamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Equipamento</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="iluminacao">Iluminação</SelectItem>
                      <SelectItem value="musical">Instrumento Musical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Localização (Opcional)</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Selecione um local" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(loc => (
                        <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
          </div>
        ) : equipments && equipments.length > 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Local</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 capitalize">{item.category}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {locations?.find(l => l.id === item.locationId)?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Mic2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum equipamento cadastrado.</p>
          </div>
        )}
      </main>
    </div>
  );
}
