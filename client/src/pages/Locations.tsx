"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useLocations, useCreateLocation } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Users, Navigation, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Parâmetros de animação para consistência entre páginas
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function Locations() {
  const { data: locations, isLoading } = useLocations();
  const { mutate: createLocation, isPending } = useCreateLocation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation(
      { 
        name: formData.name, 
        address: formData.address, 
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined 
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({ name: "", address: "", capacity: "" });
          toast({ title: "Local criado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao criar local", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        {/* HEADER COM PADRÃO DASHBOARD (x: -20) */}
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Gestão de <span className="text-primary">Espaços</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Administre salas e áreas da instituição.
            </p>
          </div>
          
          <Button 
            onClick={() => setOpen(true)} 
            className="h-14 px-8 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20 gap-3 transition-all active:scale-95 text-primary-foreground"
          >
            <Plus className="w-6 h-6" /> Novo Local
          </Button>
        </motion.header>

        {/* GRID DE LOCAIS COM STAGGERED FADE-IN */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-[2.5rem]" />)}
          </div>
        ) : locations && locations.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {locations.map((loc) => (
              <motion.div 
                key={loc.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Elemento decorativo de fundo */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="p-5 rounded-[1.2rem] bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                    <MapPin className="w-8 h-8" />
                  </div>
                  {loc.capacity && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest">
                      <Users className="w-3 h-3" />
                      {loc.capacity} Lugares
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-8 relative z-10">
                  <h3 className="text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors">
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground opacity-70">
                    <Navigation className="w-3 h-3" />
                    <p className="text-xs font-black uppercase tracking-tighter">Localização Física</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 relative z-10">
                  <p className="text-sm font-bold text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {loc.address || "Sem endereço especificado"}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 bg-card/50 border-2 border-dashed border-border rounded-[3rem]"
          >
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-bold">Nenhum local cadastrado até o momento.</p>
          </motion.div>
        )}

        {/* MODAL DE CRIAÇÃO COM ANIMATION PRESENCE */}
        <AnimatePresence>
          {open && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <form onSubmit={handleSubmit}>
                    <div className="p-10 bg-primary text-primary-foreground relative">
                      <MapPin className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                      <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-black">Adicionar Local</DialogTitle>
                      </DialogHeader>
                    </div>

                    <div className="p-10 space-y-5">
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase ml-1 opacity-60">Nome do Local</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ex: Salão Nobre" 
                          className="rounded-2xl bg-muted/50 h-14 text-lg border-none focus-visible:ring-2 focus-visible:ring-primary"
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase ml-1 opacity-60">Capacidade Máxima</Label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input 
                            type="number" 
                            value={formData.capacity} 
                            onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                            placeholder="Ex: 150" 
                            className="pl-12 rounded-2xl bg-muted/50 h-14 text-lg border-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase ml-1 opacity-60">Endereço / Bloco</Label>
                        <Input 
                          value={formData.address} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})} 
                          placeholder="Ex: Bloco B, Segundo Andar" 
                          className="rounded-2xl bg-muted/50 h-14 text-lg border-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl mt-4 shadow-xl hover:brightness-110 active:scale-95 transition-all"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-5 h-5" /> 
                            <span>Salvando...</span>
                          </div>
                        ) : "Criar Local"}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}