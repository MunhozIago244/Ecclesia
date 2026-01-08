import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export interface Assignment {
  id: number;
  eventId: number;
  ministryId: number;
  userId: number;
  roleName: string;
  status: "pending" | "confirmed" | "declined";
}

export function useAssignments() {
  return useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
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
        status: data.status || "pending"
      };
      const res = await apiRequest("POST", "/api/assignments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Candidatura enviada!" });
    },
  });
}