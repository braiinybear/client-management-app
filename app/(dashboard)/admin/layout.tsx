// app/(dashboard)/admin/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/unauthorized"); // or "/sign-in"
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user) {
    redirect("/unauthorized");
  }

  if (user.role === "EMPLOYEE") {
    redirect("/employee");
  }

  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
