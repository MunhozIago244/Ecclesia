"use client"

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMinistries, useCreateMinistry } from "@/hooks/use-ministries";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2, X, ArrowUpRight, GraduationCap, SearchX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MinistryFunctionsEditor } from "@/components/ui/MinistryFunctionsEditor";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Ministries() {
  const { data: currentUser } = useUser();
  const { data: ministries, isLoading } = useMinistries();
  const { mutate: createMinistry, isPending } = useCreateMinistry();
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState<string>("");
  const [functionInput, setFunctionInput] = useState("");
  const [tempFunctions, setTempFunctions] = useState<string[]>([]);

  const isAdmin = currentUser?.role === "admin";
  const canManage = isAdmin || currentUser?.role === "leader";

  const addTempFunction = () => {
    if (functionInput.trim() && !tempFunctions.includes(functionInput.trim())) {
      setTempFunctions([...tempFunctions, functionInput.trim()]);
      setFunctionInput("");
    }
  };

  const removeTempFunction = (index: number) => {
    setTempFunctions(tempFunctions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMinistry({
      name,
      description,
      leaderId: leaderId ? Number(leaderId) : null,
      functions: tempFunctions,
    } as any, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
        toast({ title: "Ministério criado com sucesso!" });
      },
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setLeaderId("");
    setTempFunctions([]);
    setFunctionInput("");
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        {/* HEADER COM ANIMAÇÃO */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
              <GraduationCap className="w-4 h-4" />
              Equipes de Serviço
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Ministérios
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Gerencie os grupos e a liderança da igreja.
            </p>
          </div>

          {isAdmin && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-primary/20 font-black transition-all active:scale-95 bg-primary text-primary-foreground">
                  <Plus className="w-5 h-5" /> Novo Ministério
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Criar Ministério</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  {/* ... Campos do formulário (mantidos conforme sua lógica) ... */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Nome do Ministério</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Louvor" className="rounded-xl h-11 bg-muted/50 border-none" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Líder Responsável</Label>
                      <select 
                        className="w-full h-11 px-3 rounded-xl bg-muted/50 border-none text-sm outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                        value={leaderId} onChange={(e) => setLeaderId(e.target.value)} required
                      >
                        <option value="">Selecione um líder...</option>
                        {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Adicionar Funções</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Vocal, Guitarra..." value={functionInput} className="rounded-xl bg-background border-none" onChange={(e) => setFunctionInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addTempFunction(); }}} />
                      <Button type="button" variant="secondary" onClick={addTempFunction} className="rounded-xl">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tempFunctions.map((fn, idx) => (
                        <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 gap-2 rounded-lg bg-background text-foreground border border-border/50">
                          {fn} <X className="w-3 h-3 cursor-pointer" onClick={() => removeTempFunction(idx)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl font-black" disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : "Criar Ministério"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.header>

        {/* GRID DE CARDS COM ANIMATION PRESENCE E STAGGER */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
          </div>
        ) : ministries && ministries.length > 0 ? (
          <motion.div 
            initial="hidden" 
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {ministries.map((ministry) => {
              const leader = users?.find(u => u.id === ministry.leaderId);
              return (
                <motion.div
                  key={ministry.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-card border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Elemento decorativo de fundo */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                  <div>
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <Users className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                      {ministry.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                        {leader?.name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                        Líder: <span className="text-foreground">{leader?.name || "Pendente"}</span>
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 font-medium">
                      {ministry.description || "Este ministério foca no serviço dedicado e organização dos membros para o crescimento do reino."}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                    {canManage ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="px-0 h-auto hover:bg-transparent text-primary font-black flex items-center gap-2 group/btn transition-all">
                            Gerenciar Equipe 
                            <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border rounded-[2.5rem]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-foreground">Painel: {ministry.name}</DialogTitle>
                          </DialogHeader>
                          <MinistryFunctionsEditor ministryId={ministry.id} />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Badge variant="outline" className="rounded-lg px-3 py-1 font-black text-[10px] uppercase border-primary/20 text-primary">
                        Membro Ativo
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-card/50 border-2 border-dashed border-border rounded-[3rem]"
          >
            <SearchX className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-black text-foreground">Nenhum ministério encontrado</h3>
            <p className="text-muted-foreground mt-1 mb-6 font-medium">Comece criando o primeiro ministério da igreja.</p>
            {isAdmin && <Button onClick={() => setOpen(true)} className="rounded-xl font-black shadow-lg shadow-primary/20">Criar Agora</Button>}
          </motion.div>
        )}
      </main>
    </div>
  );
}