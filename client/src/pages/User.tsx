"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useUser, useUpdateUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Phone, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  Save, 
  AtSign,
  Fingerprint
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function UserProfile() {
  const { data: user } = useUser();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    avatarUrl: "",
  });

  // Sincroniza os dados do usuário quando carregarem
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  // FUNÇÃO DE UPLOAD DA FOTO
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (ex: 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return toast({ 
        variant: "destructive", 
        title: "Arquivo muito grande", 
        description: "A imagem deve ter no máximo 2MB." 
      });
    }

    try {
      setIsUploading(true);
      
      const data = new FormData();
      data.append("file", file);

      // Enviando para o seu backend (que fará a ponte com o Cloudinary)
      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Falha no upload");

      const { url } = await res.json();

      // 1. Atualiza o estado local para refletir a imagem na hora
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      
      // 2. Salva a URL no banco de dados através do hook
      updateUser({ avatarUrl: url });

      toast({ 
        title: "Foto atualizada!", 
        description: "Sua nova imagem de perfil foi salva com sucesso." 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Erro no upload", 
        description: "Não foi possível salvar sua foto no servidor." 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData, {
      onSuccess: () => {
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso.",
        });
      },
    });
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-10">
        
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Meu <span className="text-primary italic">Perfil</span>
          </h1>
          <p className="text-muted-foreground font-medium">Gerencie suas informações pessoais e visibilidade.</p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LADO ESQUERDO: AVATAR */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-card border border-border rounded-[3rem] p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
              
              <div className="relative mb-6 mt-4">
                <Avatar className={cn(
                  "w-40 h-40 border-8 border-background shadow-2xl relative z-10 transition-all duration-500",
                  isUploading && "opacity-40 scale-95"
                )}>
                  <AvatarImage src={formData.avatarUrl} alt={formData.name} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-black">
                    {formData.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Loader do Upload */}
                {isUploading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                )}
                
                <button 
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 z-30 p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-6 h-6" />
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="relative z-10 space-y-1">
                <h2 className="text-2xl font-black text-foreground">{user?.name}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest">
                  <Fingerprint className="w-3 h-3" />
                  {user?.role}
                </div>
              </div>

              <div className="w-full mt-8 pt-8 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Status</p>
                  <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ativo
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Membro desde</p>
                  <p className="text-sm font-bold text-foreground">2026</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* LADO DIREITO: FORMULÁRIO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <form onSubmit={handleUpdate} className="bg-card border border-border rounded-[3rem] p-8 md:p-12 space-y-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase ml-1 opacity-60 flex items-center gap-2 text-foreground">
                    <User className="w-3 h-3 text-primary" /> Nome Completo
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase ml-1 opacity-60 flex items-center gap-2 text-foreground">
                    <AtSign className="w-3 h-3 text-primary" /> Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase ml-1 opacity-60 flex items-center gap-2 text-foreground">
                    <Phone className="w-3 h-3 text-primary" /> WhatsApp / Telefone
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg text-foreground"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase ml-1 opacity-40 flex items-center gap-2 text-foreground">
                    <Fingerprint className="w-3 h-3" /> Nível de Acesso
                  </Label>
                  <Input
                    value={user?.role}
                    disabled
                    className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-lg opacity-50 cursor-not-allowed text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-xs uppercase ml-1 opacity-60 text-foreground">Sobre mim / Experiência Técnica</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[120px] rounded-[1.5rem] bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-medium text-lg resize-none p-5 text-foreground"
                  placeholder="Conte um pouco sobre suas habilidades..."
                />
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-4">
                <Button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="h-16 px-10 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all flex-1 gap-3"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin w-6 h-6" />
                  ) : (
                    <>
                      <Save className="w-6 h-6" /> Salvar Alterações
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 px-10 rounded-[1.5rem] border-2 border-border font-black text-lg hover:bg-muted transition-all text-foreground"
                  onClick={() => toast({ title: "Módulo de Segurança", description: "Alteração de senha em breve." })}
                >
                  Alterar Senha
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}