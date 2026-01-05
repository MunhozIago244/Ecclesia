import { Sidebar } from "@/components/Sidebar";
import { useUser } from "@/hooks/use-auth";

export default function AdminMinistries() {
  const { data: user } = useUser();
  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <h1 className="text-2xl font-bold mb-6">Gerenciar Ministérios</h1>
        {/* Aqui entra a tabela ou lista de ministérios similar à de usuários */}
      </main>
    </div>
  );
}