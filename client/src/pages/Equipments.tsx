"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  useEquipments,
  useCreateEquipment,
  useLocations,
  useUpdateEquipment,
} from "@/hooks/use-resources";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Mic2, Monitor, Lamp, Piano, MapPin, Settings2, Loader2, Search, Wifi, Cable, Tv, Speaker, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORY_CONFIG = {
  audio: { icon: Mic2, color: "text-blue-500", bg: "bg-blue-500/10", label: "Áudio", theme: "bg-blue-600" },
  video: { icon: Monitor, color: "text-indigo-500", bg: "bg-indigo-500/10", label: "Vídeo", theme: "bg-indigo-600" },
  iluminacao: { icon: Lamp, color: "text-amber-500", bg: "bg-amber-500/10", label: "Iluminação", theme: "bg-amber-600" },
  musical: { icon: Piano, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Instrumentos", theme: "bg-emerald-600" },
  projecao: { icon: Tv, color: "text-rose-500", bg: "bg-rose-500/10", label: "Projeção", theme: "bg-rose-600" },
  rede: { icon: Wifi, color: "text-cyan-500", bg: "bg-cyan-500/10", label: "Rede e TI", theme: "bg-cyan-600" },
  acessorios: { icon: Cable, color: "text-slate-500", bg: "bg-slate-500/10", label: "Acessórios", theme: "bg-slate-600" },
  perifericos: { icon: Speaker, color: "text-violet-500", bg: "bg-violet-500/10", label: "Periféricos", theme: "bg-violet-600" },
};

// PADRÃO DE ANIMAÇÃO DO DASHBOARD
const containerVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 }
   },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Equipments() {
  const { data: currentUser } = useUser();
  const { data: equipments, isLoading } = useEquipments();
  const { data: locations } = useLocations();
  const { mutate: createEquipment, isPending: isCreating } = useCreateEquipment();
  const { mutate: updateEquipment, isPending: isUpdating } = useUpdateEquipment();
  const { toast } = useToast();

  const [openCreate, setOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "audio",
    locationId: "none",
    status: "disponivel",
  });

  const canManage = currentUser?.role === "admin" || currentUser?.role === "leader";

  const handleOpenEdit = (item: any) => {
    if (!canManage) return;
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      locationId: item.locationId ? String(item.locationId) : "none",
      status: item.status,
    });
  };

  const closeModals = () => {
    setOpenCreate(false);
    setEditingItem(null);
    setFormData({ name: "", category: "audio", locationId: "none", status: "disponivel" });
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      status: formData.status as "disponivel" | "manutencao" | "em_uso",
      locationId: formData.locationId === "none" ? null : Number(formData.locationId),
    };

    if (editingItem) {
      updateEquipment(
        { id: editingItem.id, ...payload },
        {
          onSuccess: () => {
            closeModals();
            toast({ title: "Atualizado", description: `${payload.name} foi salvo com sucesso.` });
          },
          onError: () => toast({ title: "Erro na atualização", variant: "destructive" })
        }
      );
    } else {
      createEquipment(payload, {
        onSuccess: () => {
          closeModals();
          toast({ title: "Cadastrado", description: "Item adicionado ao inventário." });
        },
        onError: () => toast({ title: "Erro ao criar", variant: "destructive" })
      });
    }
  };

  const filteredEquipments = equipments?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-10">
        
        {/* HEADER PADRONIZADO */}
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
              Inventário <span className="text-primary italic">Geral</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">
              Controle técnico de ativos e patrimônio.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="hidden md:flex px-5 py-2.5 rounded-2xl border-border bg-card shadow-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Badge>

            {canManage && (
              <Button 
                onClick={() => setOpenCreate(true)} 
                className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 gap-3 transition-all active:scale-95"
              >
                <Plus className="w-6 h-6" /> Novo Item
              </Button>
            )}
          </div>
        </motion.header>

        {/* BUSCA COM ANIMAÇÃO DE ENTRADA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou marca..."
            className="pl-14 h-16 rounded-[1.5rem] bg-card border-border shadow-sm focus-visible:ring-primary text-lg font-medium"
          />
        </motion.div>

        {/* GRID COM EFEITO DE SUBIDA (STAGGERED) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-[2.5rem]" />)}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10"
          >
            {filteredEquipments?.map((item) => {
              const config = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.acessorios;
              return (
                <motion.div 
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn("p-5 rounded-[1.2rem] group-hover:scale-110 transition-transform duration-500", config.bg, config.color)}>
                      <config.icon className="w-8 h-8" />
                    </div>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      item.status === "disponivel" ? "bg-emerald-500/10 text-emerald-600" : 
                      item.status === "manutencao" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                    )}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-8">
                    <h3 className="text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-xs font-black text-muted-foreground uppercase opacity-70 tracking-tighter">{config.label}</p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold">
                        {locations?.find((l) => l.id === item.locationId)?.name || "Almoxarifado"}
                      </span>
                    </div>
                    {canManage && (
                      <Button onClick={() => handleOpenEdit(item)} variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all">
                        <Settings2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* MODAL PADRONIZADO */}
        <AnimatePresence>
          {(openCreate || !!editingItem) && (
            <Dialog open={openCreate || !!editingItem} onOpenChange={(val) => { if (!val) closeModals(); }}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  {(() => {
                    const config = CATEGORY_CONFIG[formData.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.acessorios;
                    return (
                      <form onSubmit={onSave}>
                        <div className={cn("p-10 text-white relative transition-colors duration-500", config.theme)}>
                          <config.icon className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                          <DialogHeader className="relative z-10">
                            <DialogTitle className="text-3xl font-black tracking-tight">
                              {editingItem ? "Editar Item" : "Novo Registro"}
                            </DialogTitle>
                            <p className="text-white/70 font-medium">Preencha os dados técnicos abaixo.</p>
                          </DialogHeader>
                        </div>

                        <div className="p-10 space-y-5">
                          <div className="space-y-2">
                            <Label className="font-black text-xs uppercase ml-1 opacity-60">Nome do Equipamento</Label>
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="rounded-2xl bg-muted/50 h-14 text-lg border-none focus-visible:ring-2 focus-visible:ring-primary font-bold"
                              required
                              placeholder="Ex: Mesa Digital X32"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-black text-xs uppercase ml-1 opacity-60">Categoria</Label>
                              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-border">
                                  {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                                    <SelectItem key={key} value={key} className="rounded-xl">{val.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="font-black text-xs uppercase ml-1 opacity-60">Status</Label>
                              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-border">
                                  <SelectItem value="disponivel" className="rounded-xl font-medium">✅ Disponível</SelectItem>
                                  <SelectItem value="manutencao" className="rounded-xl font-medium">🛠️ Manutenção</SelectItem>
                                  <SelectItem value="em_uso" className="rounded-xl font-medium">🚀 Em Uso</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-black text-xs uppercase ml-1 opacity-60">Localização Fixa</Label>
                            <Select 
                              value={formData.locationId} 
                              onValueChange={(val) => setFormData({ ...formData, locationId: val })}
                            >
                              <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                                <SelectValue placeholder="Selecione o local" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-border">
                                <SelectItem value="none" className="rounded-xl">Almoxarifado / Nenhum</SelectItem>
                                {locations?.map((loc) => (
                                  <SelectItem key={loc.id} value={String(loc.id)} className="rounded-xl">{loc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl mt-4 shadow-xl hover:brightness-110 active:scale-95 transition-all gap-2"
                            disabled={isCreating || isUpdating}
                          >
                            {isCreating || isUpdating ? (
                              <Loader2 className="animate-spin w-5 h-5" /> 
                            ) : (
                              "Salvar Alterações"
                            )}
                          </Button>
                        </div>
                      </form>
                    );
                  })()}
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}