import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PerformanceChart from "./PerformanceChart";
import { Status } from "@prisma/client";

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
        select: {
          id: true,
          name: true,
          status: true,
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
      acc[client.status] = (acc[client.status] || 0) + 1;
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
        return "bg-gray-100 text-gray-800";
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-bold text-gray-900">Employee Details</h1>

      {/* Employee Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
          <p>
            <strong className="text-gray-600">Name:</strong> {employee.name}
          </p>
          <p>
            <strong className="text-gray-600">Email:</strong>{" "}
            <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
              {employee.email}
            </a>
          </p>
          <p>
            <strong className="text-gray-600">Role:</strong>{" "}
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
              <strong className="text-gray-600">Clerk ID:</strong> {employee.clerkId}
            </p>
          )}
        </div>
      </section>

      {/* Assigned Clients Table */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Assigned Clients</h2>
        {employee.assignedClients.length ? (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.assignedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(client.status)}`}
                      >
                        {client.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No clients assigned.</p>
        )}
      </section>

      {/* Performance Chart */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Performance Metrics</h2>
        {performanceData.length ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <PerformanceChart data={performanceData} />
          </div>
        ) : (
          <p className="text-gray-500">No performance data available.</p>
        )}
      </section>
    </div>
  );
}
