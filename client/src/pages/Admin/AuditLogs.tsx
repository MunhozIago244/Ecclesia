export default function AuditLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["/api/admin/audit-logs"] });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <Button variant="destructive" size="sm">Limpar Logs</Button>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log: any) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(log.createdAt), "dd/MM/yy HH:mm")}
                  </td>
                  <td className="p-4 font-mono font-bold text-primary">{log.action}</td>
                  <td className="p-4">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}