import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import ClientProfileClient from "@/components/employee/ClientProfileClient";

import type { Status } from "@prisma/client";

interface Document {
  id: string;
  name: string;
  url: string;
}

interface AssignedEmployee {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name?: string;
  phone?: string;
  status: Status;
  course?: string | null;
  hostelFee?: number | null;
  totalFee?: number | null;
  courseFee?: number | null;
  courseFeePaid?: number | null;
  hostelFeePaid?: number | null;
  totalFeePaid?: number | null;
  assignedEmployee?: AssignedEmployee | null;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export default async function EmployeeClientPage({
  params,
}: {
   params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const {id} = await params;

  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!employee || employee.role !== "EMPLOYEE") redirect("/unauthorized");

const clientRaw = await prisma.client.findFirst({
  where: {
    id: id,
    assignedEmployeeId: employee.id,
  },
  include: {
    assignedEmployee: { select: { id: true, name: true } },
    documents: true,
  },
});

  if (!clientRaw) notFound();
  // @ts-expect-error Fixing unexpected null in type from Prisma client
  const client: Client = {
    ...clientRaw,
    createdAt: clientRaw.createdAt.toISOString(),
    updatedAt: clientRaw.updatedAt.toISOString(),
  };

  return <ClientProfileClient client={client} employeeId={employee.id} />;
}
