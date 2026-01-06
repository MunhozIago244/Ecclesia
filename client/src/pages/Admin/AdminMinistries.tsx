import { Sidebar } from "@/components/Sidebar";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Pencil,
  Trash2,
  PlusCircle,
  Search,
  Church,
  Users,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function AdminMinistries() {
  const { data: currentUser } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMinistry, setEditingMinistry] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: ministries, isLoading: loadingMinistries } = useQuery<any[]>({
    queryKey: ["/api/ministries"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ministries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      setIsCreateOpen(false);
      toast({
        title: "Sucesso",
        description: "Ministério criado com sucesso.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/ministries/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      setEditingMinistry(null);
      toast({ title: "Sucesso", description: "Dados atualizados." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ministries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); // Ajustado conforme lógica anterior
      toast({
        title: "Removido",
        description: "Ministério excluído com sucesso.",
      });
    },
  });

  const filteredMinistries = ministries
  ?.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  .sort((a, b) => a.id - b.id);

  if (loadingMinistries)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ministérios</h1>
            <p className="text-muted-foreground">
              Gerencie as frentes de trabalho e suas lideranças.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md">
                <PlusCircle className="h-4 w-4" /> Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData);
                    
                    const payload = {
                      ...data,
                      leaderId: data.leaderId ? Number(data.leaderId) : null
                    };
                    
                    createMutation.mutate(payload);
                }}
              >
                <DialogHeader>
                  <DialogTitle>Cadastrar Ministério</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nome</Label>
                    <Input
                      id="create-name"
                      name="name"
                      placeholder="Ex: Louvor"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-leader">Líder Responsável</Label>
                    <select
                      id="create-leader"
                      name="leaderId"
                      className="w-full p-2 border rounded-md bg-background text-sm"
                      aria-label="Selecionar líder do ministério"
                    >
                      <option value="">Selecione um líder...</option>
                      {users
                        ?.filter((u) => u.role !== "member")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-desc">Descrição</Label>
                    <Textarea id="create-desc" name="description" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Busca */}
        <div className="mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministério..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMinistries?.map((m) => (
            <div
              key={m.id}
              className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Church className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  {/* EDITAR */}
                  <Dialog
                    open={editingMinistry?.id === m.id}
                    onOpenChange={(open) => !open && setEditingMinistry(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMinistry({
                          ...m,
                          // Garante que o leaderId seja string para o <select> HTML reconhecer o value
                          leaderId: m.leaderId?.toString() || "" 
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Ministério</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nome</Label>
                          <Input
                            id="edit-name"
                            value={editingMinistry?.name || ""}
                            onChange={(e) =>
                              setEditingMinistry({
                                ...editingMinistry,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-leader">Líder</Label>
                          <select
                            id="edit-leader"
                            className="w-full p-2 border rounded-md bg-background text-sm"
                            value={editingMinistry?.leaderId || ""}
                            onChange={(e) =>
                              setEditingMinistry({
                                ...editingMinistry,
                                leaderId: e.target.value,
                              })
                            }
                          >
                            <option value="">Selecione...</option>
                            {users?.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-desc">Descrição</Label>
                          <Textarea
                            id="edit-desc"
                            value={editingMinistry?.description || ""}
                            onChange={(e) =>
                              setEditingMinistry({
                                ...editingMinistry,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={updateMutation.isPending}
                          onClick={() => {
                            // Sanitização dos dados antes de enviar
                            const { id, name, description, leaderId } =
                              editingMinistry;
                            updateMutation.mutate({
                              id: id,
                              data: {
                                name,
                                description,
                                leaderId: leaderId ? Number(leaderId) : null,
                              },
                            });
                          }}
                        >
                          {updateMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Salvar Alterações
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Excluir ${m.name}?`))
                        deleteMutation.mutate(m.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-bold text-lg">{m.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 mb-4 h-10">
                {m.description || "Sem descrição."}
              </p>

              <div className="pt-4 border-t flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{m.memberCount || 0} Membros</span>
                </div>
                <span className="font-semibold text-primary">
                  Líder:{" "}
                  {users?.find((u) => u.id === m.leaderId)?.name || "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredMinistries?.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl mt-6">
            <Info className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              Nenhum ministério encontrado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
