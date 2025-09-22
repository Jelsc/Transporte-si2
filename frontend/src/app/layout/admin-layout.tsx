import React, { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/admin-sidebar";
import Header from "@/components/admin-header";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 320;

  return (
    <div className="h-screen overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-20`} style={{ width: sidebarWidth }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div
        className="fixed top-0 right-0 h-16 z-30"
        style={{ left: sidebarWidth }}
      >
        <Header />
      </div>
      <main
        className="fixed top-16 bottom-0 right-0 transition-all duration-300 overflow-hidden"
        style={{ left: sidebarWidth }}
      >
        <ScrollArea className="h-full">
          <div className="px-[32px] py-[48px]">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}