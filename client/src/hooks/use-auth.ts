"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertUser, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper para padronizar respostas de erro da API
async function handleResponse(res: Response, errorMsg: string) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorMsg);
  }
  return res.json();
}

/**
 * Hook para obter os dados do utilizador atual (Sessão)
 */
export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Falha ao carregar utilizador");
      const data = await res.json();
      return api.auth.me.responses[200].parse(data);
    },
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
    retry: false,
  });
}

/**
 * Hook para Login (Corrigido para aceitar email)
 */
export function useLogin() {
  const queryClient = useQueryClient();

  // Tipagem explícita para o formulário
  type LoginCredentials = {
    email: string;
    password: string;
  };

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
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

/**
 * Hook para Registo de novos utilizadores
 */
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
      const result = await handleResponse(res, "Erro ao registar");
      return api.auth.register.responses[201].parse(result);
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
    },
  });
}

/**
 * Hook para Logout
 */
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
      queryClient.clear(); // Limpa todo o cache por segurança
    },
  });
}

/**
 * Hook para Atualizar Perfil (com UI Otimista)
 */
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
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [api.auth.me.path] });
      const previousUser = queryClient.getQueryData([api.auth.me.path]);

      queryClient.setQueryData([api.auth.me.path], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousUser };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData([api.auth.me.path], context?.previousUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

/**
 * HOOK CENTRALIZADO (O que o seu Login.tsx utiliza)
 */
export function useAuth() {
  const userQuery = useUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    login: loginMutation.mutate, // Função para disparar o login
    isPending: loginMutation.isPending, // Estado de carregamento
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
  };
}
