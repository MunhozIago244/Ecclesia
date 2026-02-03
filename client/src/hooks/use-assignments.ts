import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export interface Assignment {
  id: number;
  scheduleId: number;
  userId: number;
  functionId: number;
  status: "pending" | "confirmed" | "declined";
  notes?: string;
  schedule?: {
    id: number;
    date: string;
    time?: string;
    type: string;
    name?: string;
    service?: { name: string };
    event?: { name: string };
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  function?: {
    id: number;
    name: string;
  };
}

/**
 * Hook para buscar as escalas (schedule_assignments) do usuário logado
 * Retorna assignments com informações completas de schedule, user e function
 */
export function useAssignments() {
  return useQuery<Assignment[]>({
    queryKey: ["/api/my-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/my-assignments", {
        credentials: "include",
      });

      // Se não autenticado, retorna array vazio em vez de erro
      if (res.status === 401) {
        return [];
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao buscar escalas");
      }

      return res.json();
    },
    retry: false, // Não tenta novamente em caso de erro
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        eventId: data.eventId,
        ministryId: data.ministryId,
        roleName: data.roleName,
        status: data.status || "pending",
      };
      const res = await apiRequest("POST", "/api/assignments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-assignments"] });
      toast({ title: "Candidatura enviada!" });
    },
  });
}
