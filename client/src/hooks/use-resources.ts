import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Tipos inferidos dos schemas
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
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLocation) => {
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
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
      if (!res.ok) throw new Error("Failed to fetch equipments");
      return api.equipments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEquipment) => {
      const res = await fetch(api.equipments.create.path, {
        method: api.equipments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create equipment");
      return api.equipments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertEquipment>) => {
      const path = buildUrl(api.equipments.update.path, { id });
      
      const res = await fetch(path, {
        method: api.equipments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao atualizar equipamento");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  // Definimos uma Interface para o que a API espera receber
  interface CreateScheduleDTO {
    eventId: number;
    userId: number;
    ministryId: number;
    status: string;
  }

  return useMutation({
    // Aqui dizemos ao TS que 'data' segue o formato CreateScheduleDTO
    mutationFn: async (data: CreateScheduleDTO) => {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar escala");
      return res.json();
    },
    onSuccess: () => {
      // Invalida a lista para atualizar o histórico automaticamente
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    },
  });
}