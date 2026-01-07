"use client"

import { Sidebar } from "@/components/Sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserCheck, X, Check, User, Clock, ShieldCheck, 
  SearchX, RefreshCw 
} from "lucide-react"; // Adicionado RefreshCw
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ApprovalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  // CORREÇÃO: Extraindo o 'refetch' e 'isFetching' para o botão de refresh
  const { data: requests, isLoading, refetch, isFetching } = useQuery<any[]>({ 
    queryKey: ["/api/admin/ministry-requests"] 
  });

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Lista atualizada",
      description: "As solicitações foram sincronizadas com o servidor.",
    });
  };

  const handleAction = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/ministry-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error("Erro ao processar solicitação");

      toast({ 
        title: status === 'APPROVED' ? "Membro Aprovado!" : "Solicitação Recusada",
        description: status === 'APPROVED' ? "O voluntário agora faz parte do ministério." : "A solicitação foi arquivada.",
        variant: status === 'APPROVED' ? "default" : "destructive"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ministry-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ministry-requests/count"] });
    } catch (error) {
      toast({ title: "Erro na operação", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Painel Administrativo
              </div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">
                Aprovações <span className="text-indigo-500">Pendentes</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Gerencie a entrada de novos voluntários nos ministérios.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* NOVO BOTÃO DE REFRESH */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isFetching}
                className="rounded-full w-12 h-12 border-border bg-card hover:bg-muted transition-all active:scale-90"
                title="Atualizar lista"
              >
                <RefreshCw className={cn("w-5 h-5 text-muted-foreground", isFetching && "animate-spin text-indigo-500")} />
              </Button>

              {!isLoading && requests && requests.length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-4 py-2 rounded-full font-bold">
                  {requests.length} aguardando
                </Badge>
              )}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="grid gap-6">
            {requests.map((req) => {
              const rolesDisplay = (req.roles === "{}" || !req.roles) ? "Voluntário" : req.roles;

              return (
                <div 
                  key={req.id} 
                  className="group bg-card border border-border rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center justify-between shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 gap-6"
                >
                  <div className="flex items-center gap-6 w-full lg:w-auto">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                        {req.user?.name?.charAt(0) || <User />}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center border border-border shadow-sm">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-indigo-500 transition-colors">
                        {req.user?.name || "Usuário"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-muted-foreground text-sm font-medium">
                          <UserCheck className="w-3.5 h-3.5" />
                          {req.ministry?.name}
                        </div>
                        <span className="text-muted-foreground text-sm">como</span>
                        <span className="text-foreground font-bold text-sm underline decoration-indigo-500/30 decoration-2 underline-offset-4">
                          {rolesDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        Solicitado em {req.createdAt ? format(new Date(req.createdAt), "dd 'de' MMMM", { locale: ptBR }) : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Button 
                      variant="ghost" 
                      disabled={processingId === req.id}
                      className="flex-1 lg:flex-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                      onClick={() => handleAction(req.id, 'REJECTED')}
                    >
                      <X className="w-5 h-5 mr-2" /> Recusar
                    </Button>
                    <Button 
                      disabled={processingId === req.id}
                      className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 rounded-2xl h-12 font-bold transition-all active:scale-95"
                      onClick={() => handleAction(req.id, 'APPROVED')}
                    >
                      {processingId === req.id ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" /> Aprovar Membro
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-card border-2 border-dashed border-border rounded-[3rem]">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <SearchX className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Nada por aqui!</h3>
            <p className="text-muted-foreground max-w-xs text-center mt-2 mb-6">
              Todas as solicitações foram processadas.
            </p>
            <Button variant="outline" onClick={handleRefresh} className="rounded-xl border-border">
              Checar novamente
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}