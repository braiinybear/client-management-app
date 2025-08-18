// app/(dashboard)/employee/clients/page.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import EmployeeClientsTable from "@/components/employee/EmployeeClientsTable";

export default async function EmployeeClientsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!employee) return null;

  const clients = await prisma.client.findMany({
    where: { assignedEmployeeId: employee.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
    },
  });

  return <EmployeeClientsTable clients={clients} />;
}
