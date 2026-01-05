import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Ministry } from "@shared/routes";
import { z } from "zod";

type InsertMinistry = z.infer<typeof api.ministries.create.input>;

export function useMinistries() {
  return useQuery({
    queryKey: [api.ministries.list.path],
    queryFn: async () => {
      const res = await fetch(api.ministries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ministries");
      return api.ministries.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMinistry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMinistry) => {
      const res = await fetch(api.ministries.create.path, {
        method: api.ministries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create ministry");
      return api.ministries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ministries.list.path] });
    },
  });
}

export function useMinistry(id: number) {
  return useQuery({
    queryKey: [api.ministries.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.ministries.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ministry");
      return api.ministries.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
