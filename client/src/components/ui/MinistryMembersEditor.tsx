"use client"

import * as React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"
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

// --- TIPOS ---
interface User {
  id: number
  name: string
  email: string
}

interface MinistryFunction {
  id: number
  name: string
}

// --- ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}

// --- SUB-COMPONENTES COM TIPAGEM CORRIGIDA ---

const EditorSection = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div 
      ref={ref}
      variants={itemVariants}
      className={cn("bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm", className)} 
      {...props} 
    >
      {children}
    </motion.div>
  )
)
EditorSection.displayName = "EditorSection"

const SectionHeader = ({ icon: Icon, children, className }: { icon: any; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex items-center gap-3 border-b border-border/50 pb-4", className)}>
    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
      {children}
    </h3>
  </div>
)

const SectionLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1", className)}>
    {children}
  </span>
)

// --- COMPONENTE PRINCIPAL ---

const MinistryMembersEditor = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { ministryId: number }
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

  // Mutations
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

  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: number; functionId?: number | null }) => {
      return await apiRequest("POST", `/api/ministries/${ministryId}/members`, {
        user_id: data.userId,
        function_id: data.functionId ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministries/${ministryId}/members`] })
      toast({ title: "Membro adicionado!" })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
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
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sincronizando equipe...</p>
      </div>
    )
  }

  return (
    <motion.div 
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("space-y-8 pb-10", className)} 
      {...props}
    >
      <EditorSection>
        <SectionHeader icon={Wrench}>Especialidades</SectionHeader>
        
        <div className="flex gap-3">
          <Input 
            placeholder="Ex: Teclado, Vocal, Som..." 
            value={newFunctionName}
            onChange={(e) => setNewFunctionName(e.target.value)}
            className="h-14 bg-muted/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary font-bold px-6"
            onKeyDown={(e) => e.key === 'Enter' && newFunctionName && addFunctionMutation.mutate(newFunctionName)}
          />
          <Button 
            className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
            onClick={() => newFunctionName && addFunctionMutation.mutate(newFunctionName)}
            disabled={addFunctionMutation.isPending}
            title="Adicionar especialidade"
          >
            {addFunctionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {functions?.map((fn) => (
            <motion.div 
              key={fn.id} 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-5 py-2 rounded-2xl text-xs font-black group transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <Tag className="h-3.5 w-3.5" />
              {fn.name}
              <button 
                type="button"
                onClick={() => deleteFunctionMutation.mutate(fn.id)}
                className="ml-1 opacity-50 hover:opacity-100 hover:scale-110 transition-all"
                title="Excluir especialidade"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </EditorSection>

      <EditorSection>
        <SectionHeader icon={Users}>Equipe do Ministério</SectionHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <SectionLabel>Membros Ativos</SectionLabel>
            <ScrollArea className="h-[300px] rounded-[2rem] border border-border bg-muted/20 p-4">
              <div className="space-y-3">
                {currentMembers?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm group hover:border-primary/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-sm font-black group-hover:text-primary transition-colors">{member.name}</span>
                      {member.functionName && (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{member.functionName}</span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" size="icon" 
                      className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      title="Remover membro"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <SectionLabel>Adicionar Voluntários</SectionLabel>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar por nome ou email..." 
                className="pl-12 h-14 bg-muted/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[230px] rounded-[2rem] border border-border bg-background p-4 shadow-inner">
              <div className="space-y-2">
                {availableUsers?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-2xl transition-all border border-transparent hover:border-border/50 group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground font-medium lowercase tracking-normal">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        title="Selecionar função"
                        className="h-9 px-3 text-[10px] font-black rounded-xl border-none bg-muted/50 focus:ring-2 focus:ring-primary outline-none"
                        onChange={(e) => {
                          const functionId = e.target.value ? Number(e.target.value) : null;
                          addMemberMutation.mutate({ userId: user.id, functionId });
                        }}
                        defaultValue=""
                      >
                        <option value="">Função...</option>
                        {functions?.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.name}</option>
                        ))}
                      </select>
                      <Button 
                        variant="outline" size="sm" 
                        className="h-9 gap-2 text-[10px] font-black uppercase rounded-xl border-border hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => addMemberMutation.mutate({ userId: user.id, functionId: null })}
                        disabled={addMemberMutation.isPending}
                        title="Adicionar sem função"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </EditorSection>
    </motion.div>
  )
})
MinistryMembersEditor.displayName = "MinistryMembersEditor"

export { MinistryMembersEditor }