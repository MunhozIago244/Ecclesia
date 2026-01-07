import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "./use-toast";
import { z } from "zod";

// Tipos inferidos para manter consistência com o Schema
type InsertService = z.infer<typeof api.services.create.input>;
type InsertEvent = z.infer<typeof api.events.create.input>;
type InsertSchedule = z.infer<typeof api.schedules.create.input>;
type InsertAssignment = z.infer<typeof api.schedules.assign.input>;

/* ===========================
    CULTOS (SERVICES)
   =========================== */

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar cultos");
      return api.services.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertService) => {
      const res = await fetch(api.services.create.path, {
        method: api.services.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar culto");
      return api.services.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      toast({ title: "Sucesso", description: "Culto configurado com sucesso!" });
    },
  });
}

/* ===========================
    EVENTOS (EVENTS)
   =========================== */

export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar eventos");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEvent) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar evento");
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Evento Criado", description: "O evento já está disponível para escala." });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao excluir evento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Excluído", description: "O evento foi removido.", variant: "destructive" });
    },
  });
}

/* ===========================
    ESCALAS & ATRIBUIÇÕES
   =========================== */

export function useSchedules() {
  return useQuery({
    queryKey: [api.schedules.list.path],
    queryFn: async () => {
      const res = await fetch(api.schedules.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar escalas");
      return api.schedules.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSchedule) => {
      const res = await fetch(api.schedules.create.path, {
        method: api.schedules.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar escala");
      return api.schedules.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] });
      toast({ title: "Escala Criada", description: "Membros já podem ser atribuídos." });
    },
  });
}

export function useAssignRole(scheduleId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAssignment) => {
      const url = buildUrl(api.schedules.assign.path, { id: scheduleId });
      const res = await fetch(url, {
        method: api.schedules.assign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao atribuir função");
      return api.schedules.assign.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] });
      toast({ title: "Membro Escalado", description: "A função foi preenchida com sucesso." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro na Escala", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
}