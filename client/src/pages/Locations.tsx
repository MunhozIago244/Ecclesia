"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/hooks/use-resources";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MapPin,
  Navigation,
  Loader2,
  Search,
  Calendar,
  Map as MapIcon,
  Edit2,
  Trash2,
  Users,
  MapPinned,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// PADRÃO DE ANIMAÇÃO
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Locations() {
  const { data: currentUser } = useUser();
  const { data: locations, isLoading } = useLocations();
  const { mutate: createLocation, isPending: isCreating } = useCreateLocation();
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation();
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation();
  const { toast } = useToast();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [viewLocation, setViewLocation] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
  });

  const canManage =
    currentUser?.role === "admin" || currentUser?.role === "leader";

  const closeModals = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setViewLocation(null);
    setSelectedLocation(null);
    setFormData({ name: "", address: "", capacity: "" });
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation(
      {
        name: formData.name,
        address: formData.address,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      },
      {
        onSuccess: () => {
          closeModals();
          toast({
            title: "Sucesso",
            description: "Nova localização cadastrada.",
          });
        },
        onError: () =>
          toast({ title: "Erro ao criar", variant: "destructive" }),
      },
    );
  };

  const handleOpenEdit = (loc: any) => {
    if (!canManage) return;
    setSelectedLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address || "",
      capacity: loc.capacity ? String(loc.capacity) : "",
    });
    setViewLocation(null);
    setOpenEdit(true);
  };

  const onEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    updateLocation(
      {
        id: selectedLocation.id,
        name: formData.name,
        address: formData.address,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      },
      {
        onSuccess: () => {
          closeModals();
          toast({
            title: "Atualizado",
            description: "Local atualizado com sucesso.",
          });
        },
        onError: () =>
          toast({ title: "Erro ao atualizar", variant: "destructive" }),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedLocation) return;
    deleteLocation(selectedLocation.id, {
      onSuccess: () => {
        setOpenDelete(false);
        setSelectedLocation(null);
        toast({
          title: "Excluído",
          description: "Local removido com sucesso.",
        });
      },
      onError: () =>
        toast({ title: "Erro ao excluir", variant: "destructive" }),
    });
  };

  const handleOpenGPS = (address: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank",
    );
  };

  const filteredLocations = locations?.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.address?.toLowerCase().includes(search.toLowerCase()),
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
              Locais e <span className="text-primary italic">Campus</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">
              Diretório de endereços e pontos de encontro.
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
                <Plus className="w-6 h-6" /> Novo Local
              </Button>
            )}
          </div>
        </motion.header>

        {/* BUSCA */}
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
            placeholder="Buscar por nome ou endereço..."
            className="pl-14 h-16 rounded-[1.5rem] bg-card border-border shadow-sm focus-visible:ring-primary text-lg font-medium"
          />
        </motion.div>

        {/* GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-[2.5rem]" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10"
          >
            {filteredLocations?.map((loc) => (
              <motion.div
                key={loc.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                onClick={() => setViewLocation(loc)}
                className="group bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-5 rounded-[1.2rem] bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                    <MapPin className="w-8 h-8" />
                  </div>
                  {loc.capacity && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                      {loc.capacity} Pessoas
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-sm font-bold text-muted-foreground line-clamp-2 leading-relaxed opacity-70">
                    {loc.address}
                  </p>
                </div>

                {canManage ? (
                  <div className="mt-6 pt-6 border-t border-border/50 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(loc);
                      }}
                      className="flex-1 h-10 rounded-xl text-xs font-black gap-2 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(loc);
                        setOpenDelete(true);
                      }}
                      className="flex-1 h-10 rounded-xl text-xs font-black gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-border/50 flex justify-end">
                    <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                      Ver Detalhes <Info className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* MODAL: CRIAR (PADRÃO EQUIPMENTS) */}
        <AnimatePresence>
          {openCreate && (
            <Dialog open={openCreate} onOpenChange={closeModals}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <form onSubmit={onSave}>
                  <div className="p-10 bg-primary text-primary-foreground relative overflow-hidden">
                    <MapIcon className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                    <DialogHeader className="relative z-10">
                      <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                        Novo Local
                      </DialogTitle>
                      <p className="text-primary-foreground/70 font-medium">
                        Cadastre um novo endereço no sistema.
                      </p>
                    </DialogHeader>
                  </div>

                  <div className="p-10 space-y-5">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Nome Identificador
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="rounded-2xl bg-muted/50 h-14 text-lg border-none font-bold"
                        required
                        placeholder="Ex: Templo Sede"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Endereço Completo
                      </Label>
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full rounded-2xl bg-muted/50 p-5 text-lg border-none font-bold min-h-[100px] resize-none outline-none focus:ring-2 focus:ring-primary"
                        required
                        placeholder="Rua, Número, Bairro, Cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Capacidade Estimada
                      </Label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        className="rounded-2xl bg-muted/50 h-14 text-lg border-none font-bold"
                        placeholder="Opcional"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl mt-4 gap-2"
                    >
                      {isCreating ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        "Salvar Localização"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* MODAL: EDITAR */}
        <AnimatePresence>
          {openEdit && (
            <Dialog open={openEdit} onOpenChange={() => setOpenEdit(false)}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <form onSubmit={onEdit}>
                  <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white relative overflow-hidden">
                    <Edit2 className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                    <DialogHeader className="relative z-10">
                      <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                        Editar Local
                      </DialogTitle>
                      <p className="text-white/70 font-medium">
                        Atualize as informações do local.
                      </p>
                    </DialogHeader>
                  </div>

                  <div className="p-10 space-y-5">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Nome Identificador
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="rounded-2xl bg-muted/50 h-14 text-lg border-none font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Endereço Completo
                      </Label>
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full rounded-2xl bg-muted/50 p-5 text-lg border-none font-bold min-h-[100px] resize-none outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase ml-1 opacity-60">
                        Capacidade Estimada
                      </Label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        className="rounded-2xl bg-muted/50 h-14 text-lg border-none font-bold"
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpenEdit(false)}
                        className="flex-1 h-14 rounded-2xl font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-black text-lg"
                      >
                        {isUpdating ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          "Atualizar"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* MODAL: DETALHES E GPS */}
        <AnimatePresence>
          {viewLocation && (
            <Dialog
              open={!!viewLocation}
              onOpenChange={() => setViewLocation(null)}
            >
              <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] bg-card shadow-2xl">
                <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                  <Navigation className="absolute -right-6 -top-6 w-32 h-32 opacity-20 rotate-12" />
                  <DialogHeader className="relative z-10">
                    <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                      Localização
                    </DialogTitle>
                    <p className="text-white/70 font-medium">
                      Informações de destino e rota.
                    </p>
                  </DialogHeader>
                </div>

                <div className="p-10 space-y-6 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                      {viewLocation.name}
                    </h2>
                    <p className="text-muted-foreground font-bold text-lg leading-relaxed">
                      {viewLocation.address}
                    </p>
                    {viewLocation.capacity && (
                      <Badge className="mt-4 px-4 py-2 rounded-full text-sm font-black gap-2">
                        <Users className="w-4 h-4" />
                        Capacidade: {viewLocation.capacity} pessoas
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => handleOpenGPS(viewLocation.address)}
                    className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-xl shadow-blue-500/30 gap-4 group transition-all"
                  >
                    <Navigation className="w-6 h-6 group-hover:animate-pulse" />{" "}
                    Abrir no Google Maps
                  </Button>

                  {canManage && (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleOpenEdit(viewLocation);
                        }}
                        className="flex-1 h-14 rounded-2xl font-black gap-2"
                      >
                        <Edit2 className="w-5 h-5" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedLocation(viewLocation);
                          setViewLocation(null);
                          setOpenDelete(true);
                        }}
                        className="flex-1 h-14 rounded-2xl font-black gap-2 hover:bg-destructive hover:text-white hover:border-destructive"
                      >
                        <Trash2 className="w-5 h-5" /> Excluir
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setViewLocation(null)}
                    className="w-full font-black text-muted-foreground opacity-50 hover:opacity-100 uppercase tracking-widest text-[10px]"
                  >
                    Fechar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* DIALOG: CONFIRMAR EXCLUSÃO */}
        <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
          <AlertDialogContent className="rounded-[2rem] border-2 border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                  <Trash2 className="w-6 h-6" />
                </div>
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base font-semibold pt-2">
                Tem certeza que deseja excluir{" "}
                <span className="font-black text-foreground">
                  {selectedLocation?.name}
                </span>
                ? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl font-bold h-12">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl font-black h-12 bg-destructive hover:bg-destructive/90 text-white"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Sim, Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
