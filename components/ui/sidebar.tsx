"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, User, LogOut } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: Home },
  { href: "/dashboard/employee", label: "Employee Dashboard", icon: User },
  { href: "/dashboard/admin/employees", label: "Employees", icon: Users },
  { href: "/dashboard/admin/clients", label: "Clients", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className={`bg-card border-r border-border h-full flex flex-col transition-all duration-200 ${open ? "w-56" : "w-16"} md:w-56`}>
      <button
        className="md:hidden p-4 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <span className="block w-6 h-0.5 bg-foreground mb-1"></span>
        <span className="block w-6 h-0.5 bg-foreground mb-1"></span>
        <span className="block w-6 h-0.5 bg-foreground"></span>
      </button>
      <nav className="flex-1 flex flex-col gap-2 p-2 md:p-4">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-base hover:bg-accent hover:text-accent-foreground ${pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Link href="/logout" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
