"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
};

type StatusCount = {
  status: string;
  count: number;
};

interface EmployeeDashboardClientProps {
  totalClients: number;
  recentClients?: Client[];
  statusCounts?: StatusCount[];
}

export default function EmployeeDashboardClient({
  totalClients,
  recentClients = [],
  statusCounts = [],
}: EmployeeDashboardClientProps) {
  const [recentClientsState, setRecentClientsState] = useState<Client[]>(recentClients);
  const [search, setSearch] = useState<string>("");

  const hotLeads =
    statusCounts.find((s) => s.status.toUpperCase() === "HOT")?.count || 0;
  const followUps =
    statusCounts.find((s) => s.status.toUpperCase() === "FOLLOWUP")?.count || 0;

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "HOT":
        return "bg-red-100 text-red-800";
      case "FOLLOWUP":
        return "bg-yellow-100 text-yellow-800";
      case "COLD":
        return "bg-blue-100 text-blue-800";
      case "PROSPECT":
        return "bg-purple-100 text-purple-800";
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    if (!search.trim()) {
      setRecentClientsState(recentClients);
      return;
    }

    const lower = search.toLowerCase();
    const filtered = recentClients.filter((c) =>
      [c.name ?? "", c.phone ?? "", c.status ?? ""].some((field) =>
        field.toLowerCase().includes(lower)
      )
    );

    setRecentClientsState(filtered);
  }, [search, recentClients]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track and manage your assigned clients efficiently.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-blue-100 transition duration-500 cursor-pointer hover:text-blue-900 hover:scale-[1.02] hover:drop-shadow-black">
          <CardHeader>
            <CardTitle>Total Clients</CardTitle>
          </CardHeader>
          <CardContent className="text-xl sm:text-2xl font-bold">
            {totalClients}
          </CardContent>
        </Card>
        <Card className="hover:bg-red-100 transition duration-500 cursor-pointer hover:text-red-900 hover:scale-[1.02] hover:drop-shadow-black">
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
          </CardHeader>
          <CardContent className="text-xl sm:text-2xl font-bold">
            {hotLeads}
          </CardContent>
        </Card>
        <Card className="hover:bg-yellow-100 transition duration-500 cursor-pointer hover:text-yellow-900 hover:scale-[1.02] hover:drop-shadow-black">
          <CardHeader>
            <CardTitle>Follow-ups Due</CardTitle>
          </CardHeader>
          <CardContent className="text-xl sm:text-2xl font-bold">
            {followUps}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link href="/employee/clients/new" className="flex-1 sm:flex-none">
          <Button className="w-full sm:w-auto">Add New Lead</Button>
        </Link>
        <Link href="/employee/clients" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto">
            View My Clients
          </Button>
        </Link>
      </div>

      {/* Recent Clients */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-2">
            Recent Clients (Last 7 Days)
          </h2>

          <div className="input-container">
            <input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              className="p-4 border w-[15rem] h-[3rem] rounded"
              placeholder="Search Client 🔍"
            />
          </div>
        </div>

        <div className="bg-white rounded-md shadow max-h-[50vh] overflow-y-auto">
          {recentClientsState.length > 0 ? (
            recentClientsState.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border-b last:border-0 gap-2 hover:bg-blue-50"
              >
                <div>
                  <Link
                    href={`/employee/clients/${client.id}`}
                    className="font-medium text-blue-600 hover:underline block"
                  >
                    {client.name}
                  </Link>
                  <p className="text-sm text-muted-foreground break-words">
                    {client.phone}
                  </p>
                </div>
                <span
                  className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${getStatusColor(
                    client.status
                  )}`}
                >
                  {client.status}
                </span>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              No recent clients in the last 7 days.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
