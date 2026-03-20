import { RequestTable } from "@/components/request-table";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📋 Triage Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor, filter, and manage all incoming requests.
        </p>
      </div>
      <RequestTable />
    </div>
  );
}
