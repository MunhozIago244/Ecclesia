import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  Clock,
  Target,
} from "lucide-react";
import { useAutoDistribution } from "@/hooks/use-auto-distribution";
import { cn } from "@/lib/utils";

interface Ministry {
  id: number;
  name: string;
}

interface AutoDistributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministries: Ministry[];
  onSuccess?: () => void;
}

export function AutoDistributeDialog({
  open,
  onOpenChange,
  ministries,
  onSuccess,
}: AutoDistributeDialogProps) {
  const {
    loading,
    suggestions,
    stats,
    generateSuggestions,
    applySuggestions,
    clearSuggestions,
  } = useAutoDistribution();

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("all");

  // Step control: "form" | "suggestions" | "applying"
  const [step, setStep] = useState<"form" | "suggestions">("form");

  /**
   * Handle generate suggestions
   */
  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      return;
    }

    const ministryId =
      selectedMinistryId === "all" ? null : parseInt(selectedMinistryId);
    const success = await generateSuggestions(startDate, endDate, ministryId);

    if (success) {
      setStep("suggestions");
    }
  };

  /**
   * Handle apply suggestions
   */
  const handleApply = async () => {
    const success = await applySuggestions();

    if (success) {
      // Reset form and close
      handleClose();
      onSuccess?.();
    }
  };

  /**
   * Handle close and reset
   */
  const handleClose = () => {
    setStep("form");
    setStartDate("");
    setEndDate("");
    setSelectedMinistryId("all");
    clearSuggestions();
    onOpenChange(false);
  };

  /**
   * Get today's date for min attribute
   */
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Distribuição Automática de Escalas
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Configure o período e deixe o sistema sugerir a melhor distribuição de voluntários"
              : "Revise as sugestões e aplique a distribuição automaticamente"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="start-date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Data Inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getTodayString()}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Final
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || getTodayString()}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ministry" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Ministério (opcional)
                </Label>
                <Select
                  value={selectedMinistryId}
                  onValueChange={setSelectedMinistryId}
                >
                  <SelectTrigger id="ministry">
                    <SelectValue placeholder="Selecione um ministério" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Ministérios</SelectItem>
                    {ministries.map((ministry) => (
                      <SelectItem
                        key={ministry.id}
                        value={ministry.id.toString()}
                      >
                        {ministry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Como funciona?
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>
                      Sistema analisa disponibilidade e especialização
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Equilibra carga de trabalho entre voluntários</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Previne conflitos de horário automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Você revisa antes de aplicar as mudanças</span>
                  </li>
                </ul>
              </Card>
            </motion.div>
          )}

          {step === "suggestions" && suggestions && stats && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Escalas</p>
                      <p className="text-2xl font-bold">
                        {stats.totalSchedules}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Atribuições
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalSuggestions}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Score Médio
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.avgScore.toFixed(0)}/100
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </Card>
              </div>

              {/* Suggestions List */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {suggestions.map((schedule: any) => (
                    <Card key={schedule.scheduleId} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {schedule.scheduleName}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(
                              new Date(schedule.scheduleDate),
                              "PPP 'às' HH:mm",
                              {
                                locale: ptBR,
                              },
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Target className="h-3 w-3" />
                          {schedule.suggestions.length} voluntários
                        </Badge>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-2">
                        {schedule.suggestions.map(
                          (volunteer: any, idx: number) => (
                            <div
                              key={volunteer.userId}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                idx === 0 &&
                                  "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {volunteer.userName}
                                  </span>
                                  {volunteer.functionName && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {volunteer.functionName}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {volunteer.reasons.join(" • ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {idx === 0 && (
                                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                                <Badge
                                  variant={
                                    volunteer.score >= 80
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="min-w-[60px] justify-center"
                                >
                                  {volunteer.score}/100
                                </Badge>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="mt-4">
          {step === "form" && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!startDate || !endDate || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Sugestões
                  </>
                )}
              </Button>
            </>
          )}

          {step === "suggestions" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("form");
                  clearSuggestions();
                }}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button
                onClick={handleApply}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Aplicar Distribuição
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
