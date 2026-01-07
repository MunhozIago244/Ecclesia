"use client"

import * as React from "react"
import { Check, Star, Clock, Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// --- TYPES ---
interface Ministry {
  id: number
  name: string
  roles?: { id: number; name: string }[]
}

interface UserMinistry {
  id: number
  ministryName: string
  roles: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

// Corrigido: Extensão correta da tipagem para aceitar className e props de div
interface MultiSelectMinistriesProps extends React.HTMLAttributes<HTMLDivElement> {
  userMinistries: UserMinistry[]
  allMinistries: Ministry[]
}

// --- SUB-COMPONENTS ---

// Corrigido: Removido o forwardRef do Badge (pois o Badge do Shadcn é uma função simples)
// Em vez disso, envolvemos em uma div para manter a capacidade de referência se necessário.
const MinistryBadge = React.forwardRef<
  HTMLDivElement, 
  { status: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
>(({ status, children, className, ...props }, ref) => (
  <div ref={ref} {...props}>
    <Badge
      variant={status === "APPROVED" ? "default" : "secondary"}
      className={cn(
        "gap-1.5 py-1.5 px-3 rounded-xl text-[11px] font-black transition-all border shadow-sm",
        status === "PENDING" && "opacity-70 border-dashed bg-muted/20 text-muted-foreground",
        className
      )}
    >
      {status === "PENDING" && <Clock className="w-3 h-3 animate-pulse" />}
      {children}
      {status === "PENDING" && <span className="text-[9px] ml-1 uppercase opacity-60">(Pendente)</span>}
    </Badge>
  </div>
))
MinistryBadge.displayName = "MinistryBadge"

const SelectionArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4 py-4", className)} {...props} />
  )
)
SelectionArea.displayName = "SelectionArea"

// --- MAIN COMPONENT ---

const MultiSelectMinistries = React.forwardRef<HTMLDivElement, MultiSelectMinistriesProps>(
  ({ userMinistries, allMinistries, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [selectedMinistry, setSelectedMinistry] = React.useState<string>("")
    const [selectedRoles, setSelectedRoles] = React.useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const defaultRoles = ["Vocal", "Instrumentista", "Mídia", "Sonoplastia", "Recepção", "Apoio"]

    const handleSave = async () => {
      if (!selectedMinistry || selectedRoles.length === 0) return
      
      setIsSubmitting(true)
      try {
        await apiRequest("POST", "/api/user/ministry-request", {
          ministryId: Number(selectedMinistry),
          roles: selectedRoles.join(", "),
        })

        toast({
          title: "Solicitação enviada!",
          description: "Aguarde a aprovação do líder do ministério.",
        })
        
        queryClient.invalidateQueries({ queryKey: ["/api/user/me"] })
        setOpen(false)
        setSelectedRoles([])
        setSelectedMinistry("")
      } catch (error) {
        toast({ title: "Erro ao enviar solicitação", variant: "destructive" })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div ref={ref} className={cn("flex flex-wrap gap-2 items-center", className)} {...props}>
        {userMinistries.map((um) => (
          <MinistryBadge key={um.id} status={um.status}>
            {um.ministryName} <span className="opacity-50 font-medium ml-1">({um.roles})</span>
          </MinistryBadge>
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-dashed border-primary/40 gap-2 rounded-xl hover:bg-primary/5 transition-all text-[11px] font-black uppercase tracking-wider"
            >
              <Star className="w-3.5 h-3.5 text-primary" /> 
              Servir em um Ministério
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                Onde você deseja servir?
              </DialogTitle>
            </DialogHeader>

            <SelectionArea>
              <div className="space-y-3">
                <Label htmlFor="ministry-select" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Ministério
                </Label>
                {/* Corrigido: Adicionado id para o Label e title para acessibilidade */}
                <select 
                  id="ministry-select"
                  title="Selecione o ministério desejado"
                  className="flex h-12 w-full rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={selectedMinistry}
                  onChange={(e) => setSelectedMinistry(e.target.value)}
                >
                  <option value="">Escolha um ministério...</option>
                  {allMinistries.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Suas Funções / Habilidades
                </Label>
                <div className="flex flex-wrap gap-2 border border-border/60 rounded-[1.5rem] p-4 bg-muted/10 min-h-[120px] transition-all">
                  {defaultRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role)
                    return (
                      <Badge
                        key={role}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all select-none",
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-md scale-105" 
                            : "bg-background hover:border-primary hover:text-primary"
                        )}
                        onClick={() => {
                          setSelectedRoles(prev => 
                            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                          )
                        }}
                      >
                        {role}
                        {isSelected && <Check className="ml-1 w-3 h-3" />}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </SelectionArea>

            <DialogFooter className="mt-2">
              <Button 
                onClick={handleSave} 
                disabled={!selectedMinistry || selectedRoles.length === 0 || isSubmitting}
                className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Enviar Solicitação"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
)

MultiSelectMinistries.displayName = "MultiSelectMinistries"

export { MultiSelectMinistries, MinistryBadge }