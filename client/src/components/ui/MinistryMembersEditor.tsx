import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: number;
  name: string;
  email: string;
}

export function MinistryMembersEditor({ ministryId }: { ministryId: number }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Busca os membros atuais do ministério
  const { data: currentMembers, isLoading: loadingMembers } = useQuery<User[]>({
    queryKey: [`/api/ministries/${ministryId}/members`],
  });

  // 2. Busca todos os usuários do sistema para o campo de adição
  const { data: allUsers, isLoading: loadingAll } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // 3. Mutação para adicionar membro
  const addMember = useMutation({
    mutationFn: async (userId: number) => {
        const res = await apiRequest("POST", `/api/ministries/${ministryId}/members`, { userId });
        return res;
    },
    onError: (error) => {
        toast({ 
        title: "Erro ao adicionar", 
        description: "Verifique o console para mais detalhes", 
        variant: "destructive" 
        });
        console.error("Erro na requisição:", error);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] });
        toast({ title: "Membro adicionado com sucesso!" });
    },
    });

  // 4. Mutação para remover membro
  const removeMember = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/ministries/${ministryId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] });
      toast({ title: "Membro removido do ministério." });
    },
  });

  // Filtro de pesquisa (exclui quem já é membro da lista de adição)
  const availableUsers = allUsers?.filter(user => 
    !currentMembers?.some(member => member.id === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pt-4">
      {/* Seção: Membros Atuais */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Membros Atuais 
          {loadingMembers && <Loader2 className="w-3 h-3 animate-spin" />}
        </h4>
        <ScrollArea className="h-[150px] w-full rounded-md border p-2">
          {currentMembers?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro vinculado.</p>
          )}
          <div className="space-y-2">
            {currentMembers?.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-[10px] text-muted-foreground">{member.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => removeMember.mutate(member.id)}
                  disabled={removeMember.isPending}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Seção: Adicionar Novos */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Adicionar Membros</h4>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome ou email..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar usuários para adicionar ao ministério"
          />
        </div>

        <ScrollArea className="h-[150px] w-full rounded-md border p-2">
          {availableUsers?.length === 0 && searchTerm && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuário disponível encontrado.</p>
          )}
          <div className="space-y-2">
            {availableUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{user.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1"
                  onClick={() => addMember.mutate(user.id)}
                  disabled={addMember.isPending}
                >
                  <UserPlus className="w-3 h-3" /> Adicionar
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}