"use client"

import { useState } from "react";
import { useLogin } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Church, Loader2, KeyRound, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useLogin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { username, password },
      {
        onSuccess: () => {
          setLocation("/");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: err.message || "Verifique suas credenciais.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] p-4 overflow-hidden relative font-sans">
      
      {/* BACKGROUND ELEMENTS - Mesmos do Register para continuidade visual */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      
      {/* Container de Animação de Entrada da Página */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[1000px] relative z-10"
      >
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden bg-white grid grid-cols-1 md:grid-cols-2">
          
          {/* LADO ESQUERDO: BRANDING & EXPERIENCE */}
          <div className="hidden md:flex flex-col justify-center p-12 bg-[#1E293B] relative overflow-hidden text-white border-r border-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
            
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40 mb-8">
                <Church className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-none mb-6">
                Gestão de <br />
                <span className="text-indigo-400">Excelência.</span>
              </h1>
              <p className="text-slate-400 font-medium leading-relaxed">
                Simplifique a organização da sua igreja com escalas inteligentes e comunicação em tempo real.
              </p>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 space-y-6 relative z-10"
            >
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-slate-300">Acesso seguro e restrito</span>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
              <blockquote className="text-xs italic text-slate-500 leading-relaxed">
                "Tudo deve ser feito com decência e ordem." <br /> — 1 Coríntios 14:40
              </blockquote>
            </motion.div>
          </div>

          {/* LADO DIREITO: LOGIN FORM */}
          <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login</h2>
                <p className="text-slate-500 font-medium mt-2">Bem-vindo de volta, líder!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    E-mail de Acesso
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="username"
                      type="email"
                      placeholder="exemplo@igreja.com"
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-medium"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Senha
                    </Label>
                    <Link href="#" className="text-[10px] font-black text-indigo-500 uppercase hover:text-indigo-600 transition-colors">
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
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
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-[0.98] group"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Entrar no Painel <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Primeiro acesso?{" "}
                  <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-black decoration-2 hover:underline transition-all">
                    Crie sua conta aqui
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