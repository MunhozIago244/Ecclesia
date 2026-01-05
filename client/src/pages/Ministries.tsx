import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMinistries, useCreateMinistry } from "@/hooks/use-ministries";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Ministries() {
  const { data: ministries, isLoading } = useMinistries();
  const { mutate: createMinistry, isPending } = useCreateMinistry();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMinistry(
      { name, description },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          toast({ title: "Ministério criado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao criar ministério", variant: "destructive" });
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
            <h1 className="text-3xl font-bold font-display text-foreground">Ministérios</h1>
            <p className="text-muted-foreground mt-1">Gerencie os grupos e equipes da igreja.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Ministério</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ministério</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ex: Louvor, Infantil, Diaconia..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição</Label>
                  <Textarea 
                    id="desc" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Objetivos e atividades principais..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Criando..." : "Criar Ministério"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : ministries && ministries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministries.map((ministry) => (
              <div 
                key={ministry.id} 
                className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{ministry.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {ministry.description || "Sem descrição definida."}
                </p>
                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Gerenciar Membros →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Nenhum ministério encontrado</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Comece criando o primeiro ministério da sua igreja para organizar os membros.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setOpen(true)}>
              Criar Ministério
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
