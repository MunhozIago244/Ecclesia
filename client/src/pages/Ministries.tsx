import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMinistries, useCreateMinistry } from "@/hooks/use-ministries";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MinistryMembersEditor } from "@/components/ui/MinistryMembersEditor";
import { useQuery } from "@tanstack/react-query";

export default function Ministries() {
  // --- Estados e Hooks ---
  const { data: currentUser } = useUser();
  const { data: ministries, isLoading } = useMinistries();
  const { mutate: createMinistry, isPending } = useCreateMinistry();
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });

  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Estados do Formulário
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState<string>("");

  // Permissões
  const canManage =
    currentUser?.role === "admin" || currentUser?.role === "leader";

  // --- Ações ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Enviando name, description e leaderName para o backend
    createMinistry(
      {
        name,
        description,
        leaderId: leaderId ? Number(leaderId) : null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setLeaderName("");
          toast({ title: "Ministério criado com sucesso!" });
        },
        onError: () => {
          toast({
            title: "Erro ao criar ministério",
            description: "Verifique se o banco de dados está atualizado.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-8">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Ministérios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os grupos e equipes da igreja.
            </p>
          </div>

          {/* Botão de Criação - Apenas para Admins */}
          {currentUser?.role === "admin" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Novo Ministério
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Ministério</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Ministério</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Louvor, Infantil, Mídia..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leader-select">Líder Responsável</Label>
                    <select
                      id="leader-select"
                      className="w-full p-2 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={leaderId}
                      onChange={(e) => setLeaderId(e.target.value)}
                      required
                      aria-label="Selecionar líder do ministério"
                    >
                      <option value="">Selecione um líder...</option>
                        {users?.map((user) => (
                          <option key={user.id} value={user.id}> {/* value deve ser o ID */}
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição</Label>
                    <Textarea
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva os objetivos deste ministério..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                      </span>
                    ) : (
                      "Criar Ministério"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Grid de Ministérios */}
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
                className="group bg-card hover:border-primary/50 transition-all duration-300 border border-border rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {ministry.name}
                  </h3>

                  {/* Exibição do Líder Armazenado */}
                  <p className="text-xs font-semibold text-primary mb-3">
                    Líder: {users?.find(u => u.id === ministry.leaderId)?.name || "Não definido"}
                  </p>

                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {ministry.description || "Sem descrição definida."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  {canManage ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/5 gap-2 px-0"
                        >
                          Gerenciar Membros →
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Membros - {ministry.name}</DialogTitle>
                        </DialogHeader>
                        <MinistryMembersEditor ministryId={ministry.id} />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      Somente Visualização
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Nenhum ministério encontrado
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Crie o primeiro ministério para começar a organizar as escalas e
              membros da sua igreja.
            </p>
            {currentUser?.role === "admin" && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setOpen(true)}
              >
                Criar Ministério Agora
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
