import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Location, type Equipment } from "@shared/routes";
import { z } from "zod";

// Locations
type InsertLocation = z.infer<typeof api.locations.create.input>;

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

// Equipments
type InsertEquipment = z.infer<typeof api.equipments.create.input>;

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
