import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminClientProfileClient from "@/components/admin/AdminClientProfileClient";

type Props = {
   params: Promise<{ id: string }>;
};

export const revalidate = 0;

export default async function ClientPage({ params }: Props) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      course: true,
      callResponse: true,
      notes: true,
      courseFee: true,
      courseFeePaid: true,
      hostelFee: true,
      hostelFeePaid: true,
      totalFeePaid: true,
      totalFee: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      assignedEmployee: {
        select: { id: true, name: true, email: true },
      },
      documents: {
        select: { id: true, name: true, url: true },
      },
    },
  });

  if (!client) notFound();

  const status = client.status || "";
  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const hostelFee = client.hostelFee ?? 0;
  const courseFee = client.courseFee ?? 0;
  const hostelFeePaid = client.hostelFeePaid ?? 0;
  const courseFeePaid = client.courseFeePaid ?? 0;
  const totalFee = hostelFee + courseFee;
  const totalPaid = hostelFeePaid + courseFeePaid;
  const remainingFee = totalFee - totalPaid;

  // Convert date objects to ISO strings for serialization
  const clientData = {
    ...client,
    name: client.name,
    phone: client.phone,
    status: client.status ?? "HOT",
    course: client.course,
    callResponse: client.callResponse ?? "NOTRESPONDED",
    notes: client.notes ?? "",
    hostelFee: client.hostelFee,
    courseFee: client.courseFee,
    courseFeePaid: client.courseFeePaid,
    hostelFeePaid: client.hostelFeePaid,
    totalFee: client.totalFee,
    totalFeePaid: client.totalFeePaid,
    assignedEmployee: client.assignedEmployee ? {
      id: client.assignedEmployee.id,
      name: client.assignedEmployee.name,
      email: client.assignedEmployee.email
    } : null,
    documents: client.documents,
    user: {
      id: client.user.id,
      name: client.user.name,
      email: client.user.email
    },
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString()
  };

  return <AdminClientProfileClient client={clientData} />;
}
