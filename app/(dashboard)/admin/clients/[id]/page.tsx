import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Archive, FileText, UserCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

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

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 border-b pb-3">Client Details</h1>

      {/* Basic Info */}
      <section className=" rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <UserCircle size={28} /> Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
          <div>
            <p className="font-semibold text-gray-900">Name</p>
            <p className="text-lg">{client.name ?? "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Phone</p>
            <p className="text-lg">{client.phone ?? "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full  font-medium ${
                client.status === "HOT"
                  ? "bg-red-600"
                  : client.status === "PROSPECT"
                  ? "bg-yellow-500"
                  : client.status === "FOLLOWUP"
                  ? "bg-blue-500"
                  : client.status === "COLD"
                  ? "bg-gray-400"
                  : client.status === "SUCCESS"
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            >
              {statusDisplay}
            </span>
          </div>

          {client.course && (
            <div>
              <p className="font-semibold text-gray-900">Course</p>
              <p>{client.course}</p>
            </div>
          )}

          <div>
            <p className="font-semibold text-gray-900">Hostel Fee</p>
            <p>{hostelFee > 0 ? `₹${hostelFee}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Course Fee</p>
            <p>{courseFee > 0 ? `₹${courseFee}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Hostel Fee Paid</p>
            <p>{hostelFeePaid > 0 ? `₹${hostelFeePaid}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Course Fee Paid</p>
            <p>{courseFeePaid > 0 ? `₹${courseFeePaid}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Total Fee Paid</p>
            <p>{client.totalFeePaid !== null ? `₹${client.totalFeePaid}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Total Fee</p>
            <p>{client.totalFee !== null ? `₹${client.totalFee}` : "-"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Remaining Fee</p>
            <p>{remainingFee > 0 ? `₹${remainingFee}` : "₹0"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Created At</p>
            <p>{new Date(client.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Last Updated</p>
            <p>{new Date(client.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Created By */}
      <section className=" rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <UserCircle size={28} /> Created By
        </h2>
        <p>
          <Link
            href={`/admin/employees/${client.user.id}`}
            className="text-blue-600 hover:underline"
          >
            {client.user.name ?? client.user.email ?? "Unknown"}
          </Link>
        </p>
      </section>

      {/* Assigned Employee */}
      <section className=" rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <UserCircle size={28} /> Assigned Employee
        </h2>
        {client.assignedEmployee ? (
          <p>
            <Link
              href={`/admin/employees/${client.assignedEmployee.id}`}
              className="text-blue-600 hover:underline"
            >
              {client.assignedEmployee.name ?? client.assignedEmployee.email}
            </Link>
          </p>
        ) : (
          <p className="text-gray-500">No employee assigned.</p>
        )}
      </section>

      {/* Documents */}
      <section className=" rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <Archive size={28} /> Documents
        </h2>
        {client.documents.length ? (
          <ul className="divide-y divide-gray-200 border rounded-md">
            {client.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-gray-500" size={20} />
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {doc.name ?? "Unnamed Document"}
                  </a>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={`Download ${doc.name ?? "document"}`}
                  download
                >
                  ⬇️
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No documents uploaded.</p>
        )}
      </section>
    </div>
  );
}
