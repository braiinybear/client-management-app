"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { UserButton, useUser } from "@clerk/nextjs";
import { ModeToggle } from "./ui/toggleTheme";

export type SidebarLink = {
  label: string;
  href: string;
  disabled?: boolean;
};

interface SidebarProps {
  links: SidebarLink[];
  title?: string;
}

export function Sidebar({ links, title = "Dashboard" }: SidebarProps) {
  const pathname = usePathname();
    const { user } = useUser();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile: Hamburger Menu */}
      <div className="md:hidden flex justify-start p-4 border-b border-gray-200">
        {/* removed items-center */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" aria-label="Open menu" className="p-0">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-64">
            <DialogTitle>
                <p className="hidden">sidebar</p>
            </DialogTitle>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="text-lg font-bold">{title}</span>
          
            </div>
            <ScrollArea className="h-[calc(100vh-56px)]">
              <nav className="flex flex-col p-4 space-y-1">
                {links.map(({ href, label, disabled }, idx) => (
                  <Link
                    key={idx}
                    href={disabled ? "#" : href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium
                      ${
                        isActive(href)
                          ? "bg-indigo-600 "
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </ScrollArea>
            <div className="w-full flex gap-2 justify-center items-center p-4 border-t border-gray-200">
              <ModeToggle />
              <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: {
              width: "4.1rem",
              height: "4.1rem",
            },
          },
        }}
      />
            </div>
            <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-200">
              © {new Date().getFullYear()} Your Company
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:border-r md:border-gray-200 md:">
        <div className="flex items-center h-16 px-6 border-b border-gray-200 font-bold text-lg">
          {title}
        </div>
        <ScrollArea className="flex-grow p-4">
          <nav className="flex flex-col space-y-1">
            {links.map(({ href, label, disabled }, idx) => (
              <Link
                key={idx}
                href={disabled ? "#" : href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${
                    isActive(href)
                      ? "bg-indigo-600 "
                      : "text-gray-400 hover:bg-gray-100"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
    <div className="flex gap-2 flex-col justify-center items-center w-full h-[10rem] shadow-md  rounded-lg px-4 space-x-4">
      <ModeToggle />
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: {
              width: "4.1rem",
              height: "4.1rem",
            },
          },
        }}
      />
      <h4 className="text-md text-center font-serif font-medium text-gray-500 mr-2">
        {user?.firstName ?? user?.username ?? ""}
      </h4>
    </div>
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-300">
          © {new Date().getFullYear()} Braiiny Bear
        </div>
      </aside>
    </>
  );
}
