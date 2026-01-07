"use client"

import * as React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Loader2, 
  Plus, 
  Tag, 
  Search, 
  UserPlus, 
  UserMinus, 
  Users,
  Wrench,
  X
} from "lucide-react"

// --- TYPES ---
interface User {
  id: number
  name: string
  email: string
}

interface MinistryFunction {
  id: number
  name: string
  ministry_id: number
}

// --- SUB-COMPONENTS (Originais Mantidos) ---

const EditorSection = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  )
)
EditorSection.displayName = "EditorSection"

const SectionHeader = React.forwardRef<HTMLDivElement, { icon: any; children: React.ReactNode } & React.ComponentProps<"div">>(
  ({ icon: Icon, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 text-sm font-black text-primary uppercase tracking-[0.1em]", className)} {...props}>
      <Icon className="w-4 h-4" />
      {children}
    </div>
  )
)
SectionHeader.displayName = "SectionHeader"

const SectionLabel = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-[10px] font-black text-muted-foreground uppercase tracking-widest", className)} {...props} />
  )
)
SectionLabel.displayName = "SectionLabel"

// --- MAIN COMPONENT ---

const MinistryFunctionsEditor = React.forwardRef<
  HTMLDivElement, 
  React.ComponentProps<"div"> & { ministryId: number }
>(({ ministryId, className, ...props }, ref) => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [newFunctionName, setNewFunctionName] = React.useState("")

  // Queries
  const { data: functions, isLoading: loadingFunctions } = useQuery<MinistryFunction[]>({
    queryKey: [`/api/ministries/${ministryId}/functions`],
  })

  const { data: currentMembers, isLoading: loadingMembers } = useQuery<User[]>({
    queryKey: [`/api/ministries/${ministryId}/members`],
  })

  const { data: allUsers, isLoading: loadingAll } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  })

  // --- LOGICA DE ENVIO CORRIGIDA PARA O SEU SQL ---

  const addFunctionMutation = useMutation({
    mutationFn: async (name: string) => {
      // De acordo com a tabela public.ministry_functions
      const res = await apiRequest("POST", `/api/ministries/${ministryId}/functions`, { 
        name,
        ministry_id: ministryId // FK obrigatória no seu SQL
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/functions`] })
      setNewFunctionName("")
      toast({ title: "Especialidade adicionada!" })
    },
  })

  const deleteFunctionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Alinhado com o DELETE na public.ministry_functions
      await apiRequest("DELETE", `/api/ministry-functions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/functions`] })
      toast({ title: "Removida com sucesso" })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      // De acordo com a tabela public.ministry_members
      return await apiRequest("POST", `/api/ministries/${ministryId}/members`, { 
        user_id: userId, 
        ministry_id: ministryId,
        is_leader: false 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] })
      toast({ title: "Membro adicionado!" })
    },
    onError: () => {
      toast({ title: "Erro ao adicionar", variant: "destructive" })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      // DELETE na public.ministry_members filtrando por user e ministry
      await apiRequest("DELETE", `/api/ministries/${ministryId}/members/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] })
      toast({ title: "Membro removido." })
    },
  })

  const availableUsers = allUsers?.filter(user => 
    !currentMembers?.some(member => member.id === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loadingFunctions || loadingMembers || loadingAll) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">CARREGANDO DADOS...</p>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("space-y-8 pt-4", className)} {...props}>
      <EditorSection>
        <SectionHeader icon={Wrench}>Especialidades</SectionHeader>
        <div className="flex gap-2">
          <Input 
            placeholder="Ex: Teclado, Vocal..." 
            value={newFunctionName}
            onChange={(e) => setNewFunctionName(e.target.value)}
            className="h-11 bg-muted/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFunctionName) addFunctionMutation.mutate(newFunctionName)
            }}
          />
          <Button 
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Adicionar especialidade"
            onClick={() => newFunctionName && addFunctionMutation.mutate(newFunctionName)}
            disabled={addFunctionMutation.isPending}
          >
            {addFunctionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {functions?.map((fn) => (
            <div key={fn.id} className="group flex items-center gap-2 bg-card text-foreground px-4 py-2 rounded-xl text-xs font-black border border-border shadow-sm transition-all hover:border-primary/50">
              <Tag className="w-3 h-3 text-primary" />
              {fn.name}
              <button 
                onClick={() => deleteFunctionMutation.mutate(fn.id)}
                aria-label={`Remover especialidade ${fn.name}`}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors outline-none focus:ring-2 ring-destructive rounded-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </EditorSection>

      <div className="h-px bg-border/60" />

      <EditorSection>
        <SectionHeader icon={Users}>Equipe</SectionHeader>
        <div className="space-y-3">
          <SectionLabel>Membros Vinculados</SectionLabel>
          <ScrollArea className="h-[200px] w-full rounded-[1.5rem] border bg-muted/10 p-3">
            <div className="grid gap-2">
              {currentMembers?.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-black leading-none">{member.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">{member.email}</span>
                  </div>
                  <Button 
                    variant="ghost" size="icon" 
                    aria-label={`Remover ${member.name}`}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <SectionLabel>Adicionar Voluntários</SectionLabel>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 h-11 bg-muted/30 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[200px] w-full rounded-[1.5rem] border p-3 bg-background">
            <div className="grid gap-1">
              {availableUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-all border border-transparent hover:border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{user.email}</span>
                  </div>
                  <Button 
                    variant="outline" size="sm" 
                    aria-label={`Adicionar ${user.name}`}
                    className="h-8 gap-2 text-[10px] font-black uppercase rounded-lg"
                    onClick={() => addMemberMutation.mutate(user.id)}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </EditorSection>
    </div>
  )
})
MinistryFunctionsEditor.displayName = "MinistryFunctionsEditor"

export {
  MinistryFunctionsEditor,
  EditorSection,
  SectionHeader,
  SectionLabel,
}