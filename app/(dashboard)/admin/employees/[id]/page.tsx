import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PerformanceChart from "./PerformanceChart";
import { Status } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import UploadClientsComponent from "@/components/UploadClientsComponent";

type Client = {
  id: string;
  name: string;
  status: Status;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  clerkId?: string;
  assignedClients: Client[];
};

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 0;

export default async function EmployeePage({ params }: Props) {
    const { id } = await params;

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clerkId: true,
      assignedClients: {
        // where:{status:{
        //   in:["HOT","FOLLOWUP","SUCCESS"]
        // }},
        select: {
          id: true,
          name: true,
          status: true,
          phone: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!employee) notFound();

  // Aggregate performance data
  const statusCounts = employee.assignedClients.reduce<Record<Status, number>>(
    (acc, client) => {
      acc[client.status as Status] = (acc[client.status as Status] || 0) + 1;
      return acc;
    },
    {} as Record<Status, number>
  );

  const performanceData = Object.entries(statusCounts).map(
    ([metricName, value], index) => ({
      id: `${metricName}-${index}`,
      metricName,
      value,
    })
  );

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "HOT":
        return "bg-red-100 text-red-800";
      case "PROSPECT":
        return "bg-yellow-100 text-yellow-800";
      case "FOLLOWUP":
        return "bg-blue-100 text-blue-800";
      case "COLD":
        return "bg-gray-100 text-gray-400";
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-200 text-gray-300";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-bold text-gray-500">Employee Details</h1>

      {/* Employee Info */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6  p-6 rounded-lg shadow">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-400">Basic Information</h2>
          <p>
            <strong className="text-gray-200">Name:</strong> {employee.name}
          </p>
          <p>
            <strong className="text-gray-200">Email:</strong>{" "}
            <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
              {employee.email}
            </a>
          </p>
          <p>
            <strong className="text-gray-200">Role:</strong>{" "}
            <span
              className={`inline-block px-2 py-1 text-sm font-medium rounded ${
                employee.role === "ADMIN"
                  ? "bg-red-100 text-red-700"
                  : employee.role === "EMPLOYEE"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {employee.role.toLowerCase()}
            </span>
          </p>
          {employee.clerkId && (
            <p>
              <strong className="text-gray-200">Clerk ID:</strong> {employee.clerkId}
            </p>
          )}
        </div>
      </Card>

      {/* Assigned Clients Table */}
            <Card className="p-4">
        <h2 className="text-2xl font-semibold text-gray-400 mb-4 text-center">Assigned Clients</h2>
        {employee.assignedClients.length ? (
          <div className="overflow-x-auto  rounded-lg ">
          <ScrollArea className="h-[50vh]">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase text-gray-200">
                <tr>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Phone No.</th>
                </tr>
              </thead>
                           <tbody>
                {employee.assignedClients.map((client) => {
                  if(["HOT","FOLLOWUP","SUCCESS"].includes(client.status ?? "PROSPECT"))
                  return (
                  <tr
                    key={client.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-500">{client.name ?? "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(client.status as Status)}`}
                      >
                        {client.status?.toLowerCase() ?? "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-500">{client.phone ?? "N/A"}</td>
                  </tr>
                )
                })}
              </tbody>
            </table>
          </ScrollArea>
          </div>
        ) : (
          <p className="text-gray-400">No clients assigned.</p>
        )}
      </Card>

      <Card className="p-4">
        
        <UploadClientsComponent employeeId={employee.id}/>

      </Card>

      {/* Performance Chart */}
      <Card className="shadow-lg">
        <h2 className="text-2xl text-center font-semibold dark:text-gray-300 text-gray-400 mb-4">Performance Metrics</h2>
        {performanceData.length ? (
          <div className=" p-6 rounded-lg ">
            <PerformanceChart data={performanceData} />
          </div>
        ) : (
          <p className="text-gray-500">No performance data available.</p>
        )}
      </Card>
    </div>
  );
}
