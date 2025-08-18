import { auth, currentUser } from "@clerk/nextjs/server";
import { getRoleFromSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar, SidebarLink } from "@/components/Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  let role = await getRoleFromSession();

  if (!role) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) return redirect("/unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (!dbUser) return redirect("/unauthorized");

    role = dbUser.role;
  }

  if (role !== "ADMIN" && role !== "EMPLOYEE") {
    return redirect("/unauthorized");
  }

  const adminLinks: SidebarLink[] = [
    { label: "Admin Home", href: "/admin" },
    { label: "All Clients", href: "/admin/clients" },
    { label: "Manage Employees", href: "/admin/employees" },
    { label: "Add New Employee", href: "/admin/employees/new" },
  ];

  const employeeLinks: SidebarLink[] = [
    { label: "My Dashboard", href: "/employee" },
    { label: "My Clients", href: "/employee/clients" },
    { label: "Add Client", href: "/employee/clients/new" },
    { label: "Upload Clients", href: "/employee/clients/upload" },
  ];

  const links = role === "ADMIN" ? adminLinks : employeeLinks;

  return (
     <div className="min-h-screen flex flex-col md:flex-row">
    {/* Sidebar section with fixed height */}
  
      <Sidebar links={links} />

    {/* Main scrollable content */}
    <ScrollArea className="flex-1 h-screen p-6">
      {children}
    </ScrollArea>
  </div>
  );
}
