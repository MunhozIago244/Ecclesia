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
  Trash2
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
}

// --- SUB-COMPONENTS (Padrão Sidebar/Exportável) ---

const EditorSection = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  )
)
EditorSection.displayName = "EditorSection"

const SectionHeader = React.forwardRef<HTMLDivElement, { icon: any; children: React.ReactNode } & React.ComponentProps<"div">>(
  ({ icon: Icon, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 text-sm font-black text-primary uppercase tracking-[0.1em] border-b border-border/50 pb-2", className)} {...props}>
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

const MinistryMembersEditor = React.forwardRef<
  HTMLDivElement, 
  React.ComponentProps<"div"> & { ministryId: number }
>(({ ministryId, className, ...props }, ref) => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [newFunctionName, setNewFunctionName] = React.useState("")

  // --- QUERIES ---
  const { data: functions, isLoading: loadingFunctions } = useQuery<MinistryFunction[]>({
    queryKey: [`/api/ministries/${ministryId}/functions`],
  })

  const { data: currentMembers, isLoading: loadingMembers } = useQuery<User[]>({
    queryKey: [`/api/ministries/${ministryId}/members`],
  })

  const { data: allUsers, isLoading: loadingAll } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  })

  // --- MUTATIONS: ESPECIALIDADES ---
  const addFunctionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", `/api/ministries/${ministryId}/functions`, { name })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/functions`] })
      setNewFunctionName("")
      toast({ title: "Especialidade cadastrada!" })
    },
  })

  const deleteFunctionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ministry-functions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/functions`] })
      toast({ title: "Especialidade removida." })
    },
  })

  // --- MUTATIONS: MEMBROS ---
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: number; functionId?: number | null }) => {
      return await apiRequest("POST", `/api/ministries/${ministryId}/members`, {
        user_id: data.userId,
        function_id: data.functionId !== undefined ? data.functionId : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] })
      toast({ title: "Membro adicionado com sucesso!" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao adicionar membro", 
        description: error.message || "Tente novamente",
        variant: "destructive" 
      })
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/ministries/${ministryId}/members/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] })
      toast({ title: "Membro removido do ministério." })
    },
  })

  // --- FILTROS ---
  const availableUsers = allUsers?.filter(user => 
    !currentMembers?.some(member => member.id === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loadingFunctions || loadingMembers || loadingAll) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Sincronizando dados...</p>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("space-y-10 pt-4", className)} {...props}>
      
      {/* SEÇÃO: ESPECIALIDADES */}
      <EditorSection>
        <SectionHeader icon={Wrench}>Configurar Especialidades</SectionHeader>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Ex: Teclado, Vocal, Som..." 
            value={newFunctionName}
            onChange={(e) => setNewFunctionName(e.target.value)}
            className="h-11 bg-muted/30 border-border/60 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newFunctionName) addFunctionMutation.mutate(newFunctionName)
            }}
          />
          <Button 
            size="icon" 
            className="h-11 w-11 shrink-0"
            aria-label="Cadastrar nova especialidade"
            onClick={() => newFunctionName && addFunctionMutation.mutate(newFunctionName)}
            disabled={addFunctionMutation.isPending}
          >
            {addFunctionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {functions?.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic opacity-70">Nenhuma especialidade definida.</p>
          )}
          {functions?.map((fn) => (
            <div 
              key={fn.id} 
              className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 px-4 py-1.5 rounded-xl text-[11px] font-black group transition-all hover:bg-primary/10"
            >
              <Tag className="h-3 w-3" />
              {fn.name}
              <button 
                onClick={() => deleteFunctionMutation.mutate(fn.id)}
                aria-label={`Remover especialidade ${fn.name}`}
                className="ml-1 text-primary/40 hover:text-destructive transition-colors outline-none focus:ring-1 ring-destructive rounded-full p-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </EditorSection>

      {/* SEÇÃO: MEMBROS */}
      <EditorSection>
        <SectionHeader icon={Users}>Gerenciar Equipe</SectionHeader>

        {/* Membros Atuais */}
        <div className="space-y-3">
          <SectionLabel>Membros Atuais</SectionLabel>
          <ScrollArea className="h-[180px] w-full rounded-[1.25rem] border border-border bg-muted/10 p-3">
            {currentMembers?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground/50">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Equipe vazia</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {currentMembers?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black leading-none">{member.name}</span>
                      {member.functionName && (
                        <span className="text-[10px] text-primary font-bold">{member.functionName}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-medium">{member.email}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label={`Remover ${member.name} do ministério`}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Adição de Novos */}
        <div className="space-y-3">
          <SectionLabel>Buscar Voluntários</SectionLabel>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Nome ou email..." 
              className="pl-10 h-11 bg-muted/20 border-border/60 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[180px] w-full rounded-[1.25rem] border border-border p-3 bg-background shadow-inner">
            <div className="grid gap-1">
              {availableUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-all border border-transparent hover:border-border group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {functions && functions.length > 0 && (
                      <select
                        aria-label="Selecionar função do membro"
                        className="h-8 px-2 text-[10px] font-black rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                        onChange={(e) => {
                          const functionId = e.target.value ? Number(e.target.value) : null;
                          addMemberMutation.mutate({ userId: user.id, functionId });
                        }}
                        defaultValue=""
                      >
                        <option value="">Sem função</option>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>
                            {fn.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      aria-label={`Adicionar ${user.name} como voluntário`}
                      className="h-8 gap-2 text-[10px] font-black uppercase rounded-lg border-border hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addMemberMutation.mutate({ userId: user.id, functionId: null })}
                      disabled={addMemberMutation.isPending}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>
              ))}
              {searchTerm && availableUsers?.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </EditorSection>
    </div>
  )
})
MinistryMembersEditor.displayName = "MinistryMembersEditor"

// --- EXPORTS ---
export {
  MinistryMembersEditor,
  EditorSection as MemberEditorSection,
  SectionHeader as MemberSectionHeader,
  SectionLabel as MemberSectionLabel,
}