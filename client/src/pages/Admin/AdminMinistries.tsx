"use client"

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMinistries, useCreateMinistry } from "@/hooks/use-ministries";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Users, 
  Loader2, 
  X, 
  ArrowUpRight, 
  GraduationCap, 
  SearchX, 
  Pencil, 
  Trash2,
  Church,
  Search
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MinistryFunctionsEditor } from "@/components/ui/MinistryFunctionsEditor";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMinistries() {
  const { data: currentUser } = useUser();
  const { data: ministries, isLoading } = useMinistries();
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<any>(null);
  
  // Estados para o formulário de criação
  const [tempFunctions, setTempFunctions] = useState<string[]>([]);
  const [functionInput, setFunctionInput] = useState("");

  // Mutação de Criação
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ministries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      setIsCreateOpen(false);
      setTempFunctions([]);
      toast({ title: "Sucesso", description: "Ministério criado com sucesso." });
    },
  });

  // Mutação de Atualização
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/ministries/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      setEditingMinistry(null);
      toast({ title: "Atualizado", description: "Dados do ministério salvos." });
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ministries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      toast({ title: "Removido", description: "Ministério excluído permanentemente." });
    },
  });

  const filteredMinistries = ministries
    ?.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.id - b.id);

  if (!currentUser || currentUser.role !== "admin") return null;

  const addTempFunction = () => {
    if (functionInput.trim() && !tempFunctions.includes(functionInput.trim())) {
      setTempFunctions([...tempFunctions, functionInput.trim()]);
      setFunctionInput("");
    }
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
              <Church className="w-4 h-4" />
              Administração de Equipes
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Gestão de <span className="text-primary">Ministérios</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Configure grupos, delegue líderes e defina especialidades.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-primary/20 font-black bg-primary text-primary-foreground">
                <Plus className="w-5 h-5" /> Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Cadastrar Ministério</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData);
                  createMutation.mutate({
                    ...data,
                    leaderId: data.leaderId ? Number(data.leaderId) : null,
                    functions: tempFunctions
                  });
                }} 
                className="space-y-6 pt-4"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nome do Ministério</Label>
                    <Input name="name" placeholder="Ex: Louvor, Mídia..." required className="rounded-xl h-11 bg-muted/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Líder Responsável</Label>
                    <select 
                      name="leaderId"
                      className="w-full h-11 px-3 rounded-xl bg-muted/50 border-none text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
                    >
                      <option value="">Selecione um líder...</option>
                      {users?.filter(u => u.role !== "user").map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Descrição</Label>
                    <Textarea name="description" placeholder="Objetivo do grupo..." className="rounded-xl bg-muted/50 border-none resize-none h-24" />
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Especialidades Iniciais</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ex: Violão, Fotografia..." 
                      value={functionInput}
                      onChange={(e) => setFunctionInput(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addTempFunction(); }}}
                      className="rounded-xl bg-background border-none" 
                    />
                    <Button type="button" variant="secondary" onClick={addTempFunction} className="rounded-xl">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempFunctions.map((fn, idx) => (
                      <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 gap-2 rounded-lg bg-background border border-border/50">
                        {fn} <X className="w-3 h-3 cursor-pointer" onClick={() => setTempFunctions(tempFunctions.filter((_, i) => i !== idx))} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-2xl font-black" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Criar Ministério"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.header>

        {/* PESQUISA */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ministérios..."
            className="pl-11 h-12 rounded-2xl bg-card border-border shadow-sm focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-[2.5rem]" />)}
          </div>
        ) : filteredMinistries && filteredMinistries.length > 0 ? (
          <motion.div 
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredMinistries.map((ministry) => {
              const leader = users?.find(u => u.id === ministry.leaderId);
              return (
                <motion.div
                  key={ministry.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-card border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={() => setEditingMinistry({ ...ministry, leaderId: ministry.leaderId?.toString() || "" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => confirm("Deseja realmente excluir este ministério?") && deleteMutation.mutate(ministry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                      {ministry.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                        {leader?.name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                        Líder: <span className="text-foreground">{leader?.name || "Pendente"}</span>
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 font-medium">
                      {ministry.description || "Sem descrição disponível."}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="px-0 h-auto hover:bg-transparent text-primary font-black flex items-center gap-2 group/btn">
                          Gerenciar Equipe 
                          <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-card border-border rounded-[2.5rem] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black">Membros e Especialidades: {ministry.name}</DialogTitle>
                        </DialogHeader>
                        <MinistryFunctionsEditor ministryId={ministry.id} />
                      </DialogContent>
                    </Dialog>
                    
                    <Badge variant="outline" className="rounded-lg px-3 py-1 font-black text-[10px] uppercase border-border">
                      {ministry.memberCount || 0} Voluntários
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-card/50 border-2 border-dashed border-border rounded-[3rem]">
            <SearchX className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-black text-foreground">Nenhum ministério encontrado</h3>
            <p className="text-muted-foreground mt-1 mb-6 font-medium">Tente ajustar sua busca ou crie um novo grupo.</p>
          </div>
        )}

        {/* DIALOG DE EDIÇÃO */}
        <Dialog open={!!editingMinistry} onOpenChange={(open) => !open && setEditingMinistry(null)}>
          <DialogContent className="rounded-[2.5rem] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Editar {editingMinistry?.name}</DialogTitle>
            </DialogHeader>
            {editingMinistry && (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="font-bold">Nome</Label>
                  <Input value={editingMinistry.name} onChange={(e) => setEditingMinistry({...editingMinistry, name: e.target.value})} className="rounded-xl h-11 bg-muted/50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Líder</Label>
                  <select
                    className="w-full h-11 px-3 rounded-xl bg-muted/50 border-none text-sm outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                    value={editingMinistry.leaderId}
                    onChange={(e) => setEditingMinistry({...editingMinistry, leaderId: e.target.value})}
                  >
                    <option value="">Sem líder</option>
                    {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Descrição</Label>
                  <Textarea value={editingMinistry.description || ""} onChange={(e) => setEditingMinistry({...editingMinistry, description: e.target.value})} className="rounded-xl bg-muted/50 border-none resize-none h-24" />
                </div>
                <Button className="w-full h-12 rounded-2xl font-black" onClick={() => updateMutation.mutate({ id: editingMinistry.id, data: { ...editingMinistry, leaderId: editingMinistry.leaderId ? Number(editingMinistry.leaderId) : null } })}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}