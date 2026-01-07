import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "./use-toast";
import type { Ministry, MinistryFunction } from "@shared/schema";

export function useMinistries() {
  return useQuery<any[]>({
    queryKey: [api.ministries.list.path],
    queryFn: async () => {
      const res = await fetch(api.ministries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar ministérios");
      return res.json();
    },
  });
}

export function useMinistryFunctions(ministryId: number) {
  return useQuery<MinistryFunction[]>({
    queryKey: ["/api/ministries", ministryId, "functions"],
    queryFn: async () => {
      const res = await fetch(`/api/ministries/${ministryId}/functions`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar especialidades");
      return res.json();
    },
    enabled: !!ministryId,
  });
}

export function useMinistryMembers(ministryId: number) {
  return useQuery<any[]>({
    queryKey: ["/api/ministries", ministryId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/ministries/${ministryId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar membros");
      return res.json();
    },
    enabled: !!ministryId,
  });
}

export function useAddMinistryMember(ministryId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_id: number; function_id?: number | null }) => {
      const res = await fetch(`/api/ministries/${ministryId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao adicionar membro");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries", ministryId, "members"] });
      queryClient.invalidateQueries({ queryKey: [api.ministries.list.path] });
      toast({ title: "Sucesso", description: "Membro adicionado ao ministério." });
    },
  });
}

export function useCreateMinistry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; leaderId?: number | null; functions: string[] }) => {
      const res = await fetch("/api/ministries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao criar ministério");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      toast({ title: "Sucesso", description: "Ministério criado com as especialidades." });
    },
  });
}