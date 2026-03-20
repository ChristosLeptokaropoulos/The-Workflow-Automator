"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Request, Status, Urgency } from "@/lib/types";

const URGENCY_COLORS: Record<Urgency, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-black",
  LOW: "bg-blue-400 text-white",
};

const STATUS_COLORS: Record<Status, string> = {
  NEW: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-blue-500 text-white",
  COMPLETED: "bg-green-500 text-white",
  REJECTED: "bg-zinc-400 text-white",
};

const NEXT_STATUS: Record<Status, Status | null> = {
  NEW: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: null,
  REJECTED: null,
};

export function RequestTable() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterUrgency, setFilterUrgency] = useState<string>("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterUrgency) params.set("urgency", filterUrgency);

    const res = await fetch(`/api/requests?${params}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filterStatus, filterUrgency]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(id: string, status: Status) {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRequests();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
        >
          <option value="">All Urgency</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Routed To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {req.title}
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.requester_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {req.urgency && (
                      <Badge className={URGENCY_COLORS[req.urgency]}>
                        {req.urgency}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{req.routed_team}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[req.status]}>
                      {req.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {NEXT_STATUS[req.status] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatus(req.id, NEXT_STATUS[req.status]!)
                        }
                      >
                        → {NEXT_STATUS[req.status]!.replace("_", " ")}
                      </Button>
                    )}
                    {req.status === "NEW" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-1 text-destructive"
                        onClick={() => updateStatus(req.id, "REJECTED")}
                      >
                        Reject
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
