import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "./use-toast";
import { z } from "zod";

// Tipos inferidos dos schemas para garantir integridade
type InsertLocation = z.infer<typeof api.locations.create.input>;
type InsertEquipment = z.infer<typeof api.equipments.create.input>;

/* ===========================
    LOCATIONS (LOCAIS)
   =========================== */

export function useLocations() {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: async () => {
      const res = await fetch(api.locations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar locais");
      const data = await res.json();
      return api.locations.list.responses[200].parse(data);
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertLocation) => {
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar local");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
      toast({ title: "Sucesso", description: "Local cadastrado com sucesso!" });
    },
  });
}

/* ===========================
    EQUIPMENTS (EQUIPAMENTOS)
   =========================== */

export function useEquipments() {
  return useQuery({
    queryKey: [api.equipments.list.path],
    queryFn: async () => {
      const res = await fetch(api.equipments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar equipamentos");
      const data = await res.json();
      return api.equipments.list.responses[200].parse(data);
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEquipment) => {
      // Garantir que locationId seja número se presente
      const payload = { ...data, locationId: data.locationId ? Number(data.locationId) : null };
      
      const res = await fetch(api.equipments.create.path, {
        method: api.equipments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar equipamento");
      return api.equipments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
      toast({ title: "Sucesso", description: "Equipamento adicionado." });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertEquipment>) => {
      const path = buildUrl(api.equipments.update.path, { id });
      const res = await fetch(path, {
        method: api.equipments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao atualizar equipamento");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
      toast({ title: "Atualizado", description: "Dados do equipamento salvos." });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/equipments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao excluir equipamento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
      toast({ title: "Excluído", description: "Equipamento removido do inventário." });
    },
  });
}

/* ===========================
    SCHEDULES (ESCALAS)
    Nota: Futuramente este pode mover-se para use-schedules.ts
   =========================== */

interface CreateScheduleDTO {
  eventId: number;
  userId: number;
  ministryId: number;
  status: string;
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateScheduleDTO) => {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar escala");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Escalado!", description: "O membro foi adicionado à escala." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });
}