import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { z } from "zod";

// Helper para padronizar requisições e evitar repetição de código
async function handleResponse(res: Response, errorMsg: string) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorMsg);
  }
  return res.json();
}

export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Falha ao carregar usuário");
      return api.auth.me.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 10, // Mantém o usuário em cache por 10 minutos
    retry: false,
  });
}

// NOVO HOOK: useUpdateUser com Atualização Otimista
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      return handleResponse(res, "Erro ao atualizar perfil");
    },
    // Atualização Otimista (UX instantânea)
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [api.auth.me.path] });
      const previousUser = queryClient.getQueryData([api.auth.me.path]);
      
      queryClient.setQueryData([api.auth.me.path], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousUser };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData([api.auth.me.path], context?.previousUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      const data = await handleResponse(res, "Credenciais inválidas");
      return api.auth.login.responses[200].parse(data);
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await handleResponse(res, "Erro ao registrar");
      return api.auth.register.responses[201].parse(result);
    },
    onSuccess: (user) => {
      // Opcional: Auto-login após registro
      queryClient.setQueryData([api.auth.me.path], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha no logout");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
    },
  });
}