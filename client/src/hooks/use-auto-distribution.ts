import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DistributionSuggestion {
  scheduleId: number;
  scheduleName: string;
  scheduleDate: string;
  suggestions: {
    userId: number;
    userName: string;
    functionId: number | null;
    functionName: string | null;
    score: number;
    reasons: string[];
  }[];
}

interface DistributionStats {
  totalSchedules: number;
  totalSuggestions: number;
  avgScore: number;
}

interface DistributionResult {
  success: boolean;
  suggestions: DistributionSuggestion[];
  stats: DistributionStats;
  message?: string;
}

interface ApplyResult {
  success: boolean;
  applied: number;
  failed: number;
  errors: string[];
  message?: string;
}

export function useAutoDistribution() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    DistributionSuggestion[] | null
  >(null);
  const [stats, setStats] = useState<DistributionStats | null>(null);

  const generateSuggestions = async (
    startDate: string,
    endDate: string,
    ministryId?: number | null,
  ): Promise<boolean> => {
    setLoading(true);
    setSuggestions(null);
    setStats(null);

    try {
      const response = await apiRequest("POST", "/api/schedules/auto-suggest", {
        startDate,
        endDate,
        ministryId,
        requireApproval: true,
      });

      const data: DistributionResult = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        setStats(data.stats);

        toast({
          title: "✅ Sugestões geradas!",
          description: `${data.stats.totalSuggestions} atribuições sugeridas para ${data.stats.totalSchedules} escalas. Pontuação média: ${data.stats.avgScore.toFixed(0)}/100`,
          duration: 5000,
        });

        return true;
      } else {
        toast({
          variant: "destructive",
          title: "❌ Erro ao gerar sugestões",
          description: data.message || "Não foi possível gerar as sugestões",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Erro ao gerar sugestões:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao gerar sugestões",
        description: error.message || "Erro de conexão com o servidor",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const applySuggestions = async (): Promise<boolean> => {
    if (!suggestions || suggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "⚠️ Nenhuma sugestão",
        description: "Gere as sugestões primeiro antes de aplicar",
      });
      return false;
    }

    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/schedules/auto-apply", {
        suggestions,
      });

      const data: ApplyResult = await response.json();

      if (data.success) {
        toast({
          title: "✅ Distribuição aplicada!",
          description: `${data.applied} atribuições criadas com sucesso. ${data.failed} falharam.`,
          duration: 5000,
        });

        if (data.errors.length > 0) {
          console.warn("Erros na aplicação:", data.errors);
          setTimeout(() => {
            toast({
              variant: "default",
              title: "⚠️ Alguns avisos",
              description: `${data.errors.length} atribuições não foram criadas. Veja o console para detalhes.`,
              duration: 4000,
            });
          }, 2000);
        }

        setSuggestions(null);
        setStats(null);

        return true;
      } else {
        toast({
          variant: "destructive",
          title: "❌ Erro ao aplicar distribuição",
          description: data.message || "Não foi possível aplicar as sugestões",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Erro ao aplicar sugestões:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao aplicar distribuição",
        description: error.message || "Erro de conexão com o servidor",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions(null);
    setStats(null);
  };

  return {
    loading,
    suggestions,
    stats,
    generateSuggestions,
    applySuggestions,
    clearSuggestions,
  };
}
