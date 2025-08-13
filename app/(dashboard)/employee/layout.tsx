import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user) redirect("/unauthorized");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "MEMBER") redirect("/client");
  if (user.role !== "EMPLOYEE") redirect("/unauthorized");

  return <>{children}</>;
}
