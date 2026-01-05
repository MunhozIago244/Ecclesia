import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { useSchedules, useEvents } from "@/hooks/use-schedules";
import { useMinistries } from "@/hooks/use-ministries";
import { useUser } from "@/hooks/use-auth";
import { Users, Calendar, ClipboardList, Church } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: schedules, isLoading: isLoadingSchedules } = useSchedules();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: ministries, isLoading: isLoadingMinistries } = useMinistries();
  
  const today = new Date();

  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + 7);

  const servicesThisWeek =
    events?.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= endOfWeek;
    }) || [];

  const mySchedules = schedules?.filter(s => 
    s.assignments.some(a => a.userId === user?.id)
  ) || [];

  const upcomingEvents = events?.filter(e => 
    new Date(e.date) >= new Date()
  ).slice(0, 3) || [];

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground">
            Olá, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o que está acontecendo na sua igreja hoje.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ministérios"
            value={ministries?.length || 0}
            icon={Users}
            description="Ativos na igreja"
          />
          <StatCard
            title="Eventos Próximos"
            value={upcomingEvents.length}
            icon={Calendar}
            description="Nos próximos 30 dias"
          />
          <StatCard
            title="Minhas Escalas"
            value={mySchedules.length}
            icon={ClipboardList}
            description="Escalado este mês"
            trend="neutral" //up, down
            trendValue=""
          />
          <StatCard
            title="Cultos da Semana"
            value={servicesThisWeek.length} // Mock value for simplicity
            icon={Church}
            description="Esta semana"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Próximos Eventos</h2>
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                Agenda
              </span>
            </div>
            
            {isLoadingEvents ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex flex-col items-center justify-center text-center border border-border">
                      <span className="text-xs font-bold text-red-500 uppercase">
                        {format(new Date(event.date), 'MMM', { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold text-foreground leading-none">
                        {format(new Date(event.date), 'dd')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.time} • {event.description || 'Sem descrição'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum evento próximo.
              </p>
            )}
          </div>

          {/* My Schedules */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Minhas Escalas</h2>
              <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Pessoal
              </span>
            </div>

            {isLoadingSchedules ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : mySchedules.length > 0 ? (
              <div className="space-y-4">
                {mySchedules.map((schedule) => {
                  const assignment = schedule.assignments.find(a => a.userId === user?.id);
                  return (
                    <div key={schedule.id} className="flex items-center justify-between p-4 rounded-lg bg-purple-50/50 border border-purple-100 dark:bg-purple-900/10 dark:border-purple-800">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {schedule.name || schedule.type}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(schedule.date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 rounded bg-white dark:bg-black/20 border border-border text-xs font-medium">
                          {assignment?.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <ClipboardList className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Você não está escalado para nada no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
