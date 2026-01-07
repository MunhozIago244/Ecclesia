"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background transition-colors duration-300 relative overflow-hidden">
      
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-lg mx-4 border-none bg-transparent shadow-none relative z-10">
        <CardContent className="flex flex-col items-center text-center p-0">
          
          {/* Ícone Animado */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-[3rem] bg-indigo-500/10 flex items-center justify-center rotate-12 animate-pulse">
              <Compass className="w-16 h-16 text-indigo-500 -rotate-12" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-xl">
              <span className="text-xl font-black text-indigo-500">?</span>
            </div>
          </div>

          {/* Texto Principal */}
          <div className="space-y-4">
            <h1 className="text-8xl font-black text-foreground tracking-tighter opacity-20">
              404
            </h1>
            <h2 className="text-4xl font-black text-foreground tracking-tight -mt-12">
              Caminho <span className="text-indigo-500">Não Encontrado</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto font-medium">
              Parece que você se aventurou por uma rota que ainda não foi mapeada no sistema.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-sm">
            <Link href="/">
              <Button 
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar ao Início
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full h-14 rounded-2xl border-border bg-card font-black hover:bg-muted transition-all active:scale-95 gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Página Anterior
            </Button>
          </div>

          {/* Rodapé discreto */}
          <p className="mt-12 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Church Management System • 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}