import { storage } from "./storage.js";
import type {
  User,
  Schedule,
  MinistryFunction,
  ScheduleAssignment,
} from "@shared/schema";

/**
 * SERVIÇO DE DISTRIBUIÇÃO AUTOMÁTICA DE ESCALAS
 *
 * Algoritmo inteligente que atribui voluntários a escalas considerando:
 * - Disponibilidade dos membros
 * - Rotatividade equilibrada (evita sobrecarga)
 * - Especialidades/funções requeridas
 * - Histórico de participação
 * - Prevenção de conflitos de horário
 */

interface VolunteerWithScore {
  user: User;
  functionId: number | null;
  functionName: string | null;
  score: number;
  reasons: string[];
}

interface ScheduleRequirement {
  scheduleId: number;
  scheduleName: string;
  scheduleDate: Date;
  functionId?: number;
  functionName?: string;
  quantity?: number; // Quantos voluntários são necessários para esta função
}

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

interface DistributionResult {
  success: boolean;
  suggestions: DistributionSuggestion[];
  stats: {
    totalSchedules: number;
    totalAssignments: number;
    avgScore: number;
  };
}

class SchedulerService {
  /**
   * Gera sugestões automáticas de distribuição para múltiplas escalas
   */
  async suggestDistribution(
    scheduleIds: number[],
    ministryId?: number,
  ): Promise<DistributionResult> {
    const suggestions: DistributionSuggestion[] = [];
    let totalAssignments = 0;
    let totalScore = 0;

    for (const scheduleId of scheduleIds) {
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) continue;

      // Buscar funções do ministério (se especificado)
      let functions: MinistryFunction[] = [];
      if (ministryId) {
        functions = await storage.getMinistryFunctions(ministryId);
      }

      // Se há funções específicas, distribuir para cada uma
      if (functions.length > 0) {
        for (const func of functions) {
          const volunteers = await this.findBestVolunteers(
            scheduleId,
            schedule.date,
            func.id,
            1, // 1 voluntário por função por padrão
          );

          if (volunteers.length > 0) {
            const topVolunteer = volunteers[0];
            suggestions.push({
              scheduleId,
              scheduleName: schedule.name || "Serviço",
              scheduleDate: schedule.date.toISOString(),
              suggestions: [
                {
                  userId: topVolunteer.user.id,
                  userName: topVolunteer.user.name,
                  functionId: topVolunteer.functionId,
                  functionName: topVolunteer.functionName,
                  score: topVolunteer.score,
                  reasons: topVolunteer.reasons,
                },
              ],
            });
            totalAssignments++;
            totalScore += topVolunteer.score;
          }
        }
      } else {
        // Sem funções específicas, buscar voluntários gerais
        const volunteers = await this.findBestVolunteers(
          scheduleId,
          schedule.date,
          undefined,
          3, // Sugerir top 3 voluntários
        );

        if (volunteers.length > 0) {
          suggestions.push({
            scheduleId,
            scheduleName: schedule.name || "Serviço",
            scheduleDate: schedule.date.toISOString(),
            suggestions: volunteers.map((v) => ({
              userId: v.user.id,
              userName: v.user.name,
              functionId: v.functionId,
              functionName: v.functionName,
              score: v.score,
              reasons: v.reasons,
            })),
          });
          totalAssignments += volunteers.length;
          totalScore += volunteers.reduce((sum, v) => sum + v.score, 0);
        }
      }
    }

    return {
      success: true,
      suggestions,
      stats: {
        totalSchedules: scheduleIds.length,
        totalAssignments,
        avgScore: totalAssignments > 0 ? totalScore / totalAssignments : 0,
      },
    };
  }

  /**
   * Encontra os melhores voluntários para uma escala específica
   */
  private async findBestVolunteers(
    scheduleId: number,
    scheduleDate: Date,
    functionId?: number,
    limit: number = 5,
  ): Promise<VolunteerWithScore[]> {
    // 1. Buscar todos os usuários ativos
    const allUsers = await storage.getUsers();
    const activeUsers = allUsers.filter((u) => u.active === true);

    // 2. Calcular score para cada usuário
    const scoredVolunteers: VolunteerWithScore[] = [];

    for (const user of activeUsers) {
      const score = await this.calculateVolunteerScore(
        user,
        scheduleDate,
        functionId,
      );

      if (score.total > 0) {
        scoredVolunteers.push({
          user,
          functionId: functionId || null,
          functionName: null, // Será preenchido depois se necessário
          score: score.total,
          reasons: score.reasons,
        });
      }
    }

    // 3. Ordenar por score (maior primeiro)
    scoredVolunteers.sort((a, b) => b.score - a.score);

    // 4. Retornar os top N
    return scoredVolunteers.slice(0, limit);
  }

  /**
   * Calcula o score de adequação de um voluntário para uma escala
   * Score maior = mais adequado
   */
  private async calculateVolunteerScore(
    user: User,
    scheduleDate: Date,
    functionId?: number,
  ): Promise<{ total: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // CRITÉRIO 1: Disponibilidade (peso: 40 pontos)
    const dayOfWeek = scheduleDate.getDay(); // 0 = Domingo, 6 = Sábado
    const isAvailable = await this.checkAvailability(user.id, dayOfWeek);
    if (isAvailable) {
      score += 40;
      reasons.push("Disponível neste dia");
    } else {
      reasons.push("❌ Indisponível neste dia");
      return { total: 0, reasons }; // Se não disponível, score 0
    }

    // CRITÉRIO 2: Especialização (peso: 30 pontos)
    if (functionId) {
      const hasFunction = await this.userHasFunction(user.id, functionId);
      if (hasFunction) {
        score += 30;
        reasons.push("Qualificado para a função");
      } else {
        score += 5; // Pode servir, mas não é especialista
        reasons.push("Pode atuar na função");
      }
    } else {
      score += 15; // Escala sem função específica
      reasons.push("Voluntário disponível");
    }

    // CRITÉRIO 3: Rotatividade (peso: 20 pontos)
    const recentAssignments = await this.getRecentAssignmentsCount(
      user.id,
      30, // últimos 30 dias
    );

    if (recentAssignments === 0) {
      score += 20;
      reasons.push("Não serviu recentemente (+rotatividade)");
    } else if (recentAssignments === 1) {
      score += 15;
      reasons.push("Serviu 1x recentemente");
    } else if (recentAssignments === 2) {
      score += 10;
      reasons.push("Serviu 2x recentemente");
    } else {
      score += 5;
      reasons.push(`Serviu ${recentAssignments}x recentemente`);
    }

    // CRITÉRIO 4: Histórico de confirmação (peso: 10 pontos)
    const confirmationRate = await this.getConfirmationRate(user.id);
    if (confirmationRate >= 0.9) {
      score += 10;
      reasons.push("Alta taxa de confirmação (>90%)");
    } else if (confirmationRate >= 0.7) {
      score += 7;
      reasons.push("Boa taxa de confirmação (>70%)");
    } else if (confirmationRate >= 0.5) {
      score += 4;
      reasons.push("Taxa de confirmação moderada");
    } else {
      reasons.push("Baixa taxa de confirmação");
    }

    return { total: score, reasons };
  }

  /**
   * Verifica se o usuário está disponível em um dia da semana
   */
  private async checkAvailability(
    userId: number,
    dayOfWeek: number,
  ): Promise<boolean> {
    // Por enquanto, considera todos disponíveis
    // TODO: Implementar consulta real na tabela userAvailability
    return true;
  }

  /**
   * Verifica se o usuário tem uma função específica
   */
  private async userHasFunction(
    userId: number,
    functionId: number,
  ): Promise<boolean> {
    try {
      // Buscar se o usuário é membro de algum ministério com essa função
      const func = await storage.getMinistryFunction(functionId);
      if (!func) return false;

      const members = await storage.getMinistryMembers(func.ministryId);
      return members.some(
        (m) => m.id === userId && m.functionId === functionId,
      );
    } catch {
      return false;
    }
  }

  /**
   * Conta quantas escalas o usuário teve nos últimos N dias
   */
  private async getRecentAssignmentsCount(
    userId: number,
    days: number,
  ): Promise<number> {
    try {
      const schedules = await storage.getSchedules();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let count = 0;
      for (const schedule of schedules) {
        if (new Date(schedule.date) < cutoffDate) continue;

        const userAssignment = schedule.assignments.find(
          (a) => a.userId === userId,
        );
        if (userAssignment) count++;
      }

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Calcula a taxa de confirmação do usuário (confirmed / total assignments)
   */
  private async getConfirmationRate(userId: number): Promise<number> {
    try {
      const schedules = await storage.getSchedules();
      let totalAssignments = 0;
      let confirmedAssignments = 0;

      for (const schedule of schedules) {
        const userAssignment = schedule.assignments.find(
          (a) => a.userId === userId,
        );
        if (userAssignment) {
          totalAssignments++;
          if (userAssignment.status === "confirmed") {
            confirmedAssignments++;
          }
        }
      }

      return totalAssignments > 0
        ? confirmedAssignments / totalAssignments
        : 0.8; // 80% por padrão
    } catch {
      return 0.8; // Assume 80% se houver erro
    }
  }

  /**
   * Aplica automaticamente as sugestões de distribuição
   */
  async applyDistribution(suggestions: DistributionSuggestion[]): Promise<{
    success: boolean;
    assignmentsCreated: number;
    errors: string[];
  }> {
    let assignmentsCreated = 0;
    const errors: string[] = [];

    for (const suggestion of suggestions) {
      for (const volunteer of suggestion.suggestions) {
        try {
          // Verificar se já existe atribuição
          const schedule = await storage.getSchedule(suggestion.scheduleId);
          if (!schedule) {
            errors.push(`Escala ${suggestion.scheduleId} não encontrada`);
            continue;
          }

          // Busca assignments da escala para verificar se já existe atribuição
          const assignments: ScheduleAssignment[] =
            await storage.getScheduleAssignments(schedule.id);
          const existingAssignment = assignments.find(
            (a: ScheduleAssignment) => a.userId === volunteer.userId,
          );

          if (existingAssignment) {
            errors.push(
              `${volunteer.userName} já está escalado para ${suggestion.scheduleName}`,
            );
            continue;
          }

          // Criar nova atribuição
          await storage.createAssignment({
            scheduleId: suggestion.scheduleId,
            userId: volunteer.userId,
            functionId: volunteer.functionId,
            status: "pending",
            notes: `Distribuição automática (score: ${volunteer.score.toFixed(0)})`,
          });

          assignmentsCreated++;
        } catch (error: any) {
          errors.push(
            `Erro ao escalar ${volunteer.userName}: ${error.message}`,
          );
        }
      }
    }

    return {
      success: assignmentsCreated > 0,
      assignmentsCreated,
      errors,
    };
  }

  /**
   * Valida se uma distribuição é viável
   */
  async validateDistribution(
    scheduleId: number,
    userId: number,
  ): Promise<{ valid: boolean; reason?: string }> {
    // Verificar se o usuário está ativo
    const user = await storage.getUser(userId);
    if (!user || !user.active) {
      return { valid: false, reason: "Usuário inativo ou não encontrado" };
    }

    // Verificar se já está escalado
    const schedule = await storage.getSchedule(scheduleId);
    if (!schedule) {
      return { valid: false, reason: "Escala não encontrada" };
    }

    const assignments: ScheduleAssignment[] =
      await storage.getScheduleAssignments(scheduleId);
    const existingAssignment = assignments.find(
      (a: ScheduleAssignment) => a.userId === userId,
    );
    if (existingAssignment) {
      return { valid: false, reason: "Usuário já escalado para esta data" };
    }

    // Verificar conflitos de horário (escalas no mesmo dia)
    const scheduleDate = new Date(schedule.date);
    const schedules = await storage.getSchedules();

    for (const otherSchedule of schedules) {
      if (otherSchedule.id === scheduleId) continue;

      const otherDate = new Date(otherSchedule.date);
      const sameDay =
        scheduleDate.getFullYear() === otherDate.getFullYear() &&
        scheduleDate.getMonth() === otherDate.getMonth() &&
        scheduleDate.getDate() === otherDate.getDate();

      if (sameDay) {
        const hasConflict = otherSchedule.assignments.some(
          (a) => a.userId === userId,
        );
        if (hasConflict) {
          return {
            valid: false,
            reason: "Usuário já tem outra escala no mesmo dia",
          };
        }
      }
    }

    return { valid: true };
  }
}

// Exporta uma instância única (Singleton)
export const schedulerService = new SchedulerService();
