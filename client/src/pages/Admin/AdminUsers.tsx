"use client"

import { Sidebar } from "@/components/Sidebar";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Trash2, 
  UserCog, 
  ShieldCheck, 
  Mail, 
  User, 
  Circle 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function AdminUsers() {
  const { data: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Removido", description: "Usuário excluído com sucesso." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      // Garantimos que estamos enviando apenas os campos necessários
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, {
        name: data.name,
        role: data.role,
        active: data.active
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "Sucesso", description: "Dados atualizados com sucesso." });
    },
  });

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Gestão de Acessos
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Membros do <span className="text-indigo-500">Sistema</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Controle permissões, ative ou desative voluntários da Ecclesia.
            </p>
          </div>
        </header>

        {/* TABELA DE USUÁRIOS */}
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-muted-foreground font-bold">Carregando membros...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Membro</th>
                    <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Privilégio</th>
                    <th className="p-6 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map((u) => (
                    <tr key={u.id} className={`hover:bg-muted/30 transition-all group ${!u.active ? 'opacity-60 italic' : ''}`}>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${u.active ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* STATUS VISUAL */}
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <Circle className={`w-2 h-2 fill-current ${u.active ? 'text-emerald-500' : 'text-rose-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${u.active ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {u.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </td>

                      <td className="p-6">
                        <Badge 
                          variant="outline" 
                          className={`
                            rounded-lg px-3 py-1 border-none font-black uppercase text-[10px] tracking-wider
                            ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 
                              u.role === 'leader' ? 'bg-amber-500/10 text-amber-500' : 
                              'bg-emerald-500/10 text-emerald-500'}
                          `}
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog 
                            open={editingUser?.id === u.id} 
                            onOpenChange={(open) => !open && setEditingUser(null)}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl hover:bg-indigo-500/10 hover:text-indigo-500"
                                onClick={() => setEditingUser(u)}
                              >
                                <UserCog className="h-5 w-5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem] border-border bg-card max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Editar Membro</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-6 py-6">
                                {/* NOME */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Voluntário</label>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      className="pl-10 rounded-xl bg-background border-border"
                                      value={editingUser?.name || ""} 
                                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    />
                                  </div>
                                </div>

                                {/* SWITCH DE ATIVAÇÃO */}
                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${editingUser?.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                  <div className="space-y-0.5">
                                    <label className="text-sm font-bold">Acesso ao Sistema</label>
                                    <p className="text-xs text-muted-foreground">
                                      {editingUser?.active ? "Conta ativa e liberada." : "Conta bloqueada para uso."}
                                    </p>
                                  </div>
                                  <Switch 
                                    checked={editingUser?.active}
                                    onCheckedChange={(checked) => setEditingUser({...editingUser, active: checked})}
                                  />
                                </div>

                                {/* CARGO/ROLE */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nível de Permissão</label>
                                  <select 
                                    className="w-full p-3 rounded-xl bg-background border border-border text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editingUser?.role || "user"}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                  >
                                    <option value="user">Membro (Voluntário)</option>
                                    <option value="leader">Líder (Gestor)</option>
                                    <option value="admin">Administrador</option>
                                  </select>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button 
                                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 shadow-lg shadow-indigo-500/20"
                                  onClick={() => updateMutation.mutate({ id: u.id, data: editingUser })}
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                            onClick={() => {
                              if(confirm(`Tem certeza que deseja excluir ${u.name}?`)) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            disabled={u.id === currentUser.id} // Impede o admin de se deletar
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}