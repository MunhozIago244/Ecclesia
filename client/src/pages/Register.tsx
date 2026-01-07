"use client"

import { useState } from "react";
import { useRegister } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Church, Loader2, ArrowRight, CheckCircle2, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { mutate: register, isPending } = useRegister();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(
      { email, password, name, role: "VOLUNTARIO" },
      {
        onSuccess: () => {
          toast({
            title: "Conta criada com sucesso!",
            description: "Bem-vindo(a) à nossa comunidade.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: err.message,
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] p-4 overflow-hidden relative font-sans">
      
      {/* BACKGROUND ELEMENTS - Idênticos ao Login para continuidade */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />

      {/* Container de Animação de Entrada - Padronizado com Scale e Opacity */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[1000px] relative z-10"
      >
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden bg-white grid grid-cols-1 md:grid-cols-5 min-h-[600px]">
          
          {/* LADO ESQUERDO: BRANDING & INFO */}
          <div className="hidden md:flex md:col-span-2 bg-[#1E293B] p-12 flex-col justify-between text-white relative overflow-hidden border-r border-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
            
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
                <Church className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-black leading-tight tracking-tighter">
                Sua igreja, <br />
                <span className="text-indigo-400">digital.</span>
              </h2>
              <p className="mt-6 text-slate-400 text-sm font-medium leading-relaxed">
                Junte-se a milhares de voluntários que utilizam nossa plataforma para organizar o serviço cristão com excelência.
              </p>
            </motion.div>

            <div className="space-y-4 relative z-10">
              {[
                "Cadastro Rápido",
                "Perfil Personalizado",
                "Acesso a Escalas"
              ].map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                  key={item} 
                  className="flex items-center gap-3 text-xs font-bold text-slate-300"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          {/* LADO DIREITO: FORMULÁRIO */}
          <div className="col-span-1 md:col-span-3 p-8 md:p-12 bg-white flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Criar Conta</h1>
                <p className="text-slate-500 text-sm mt-2 font-medium">Preencha os campos para começar sua jornada.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Nome Completo
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="name"
                      placeholder="Como quer ser chamado?"
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    E-mail
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Defina uma Senha
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] group mt-4"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Finalizar Cadastro <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-50 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Já faz parte da equipe?{" "}
                  <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-black transition-colors">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}