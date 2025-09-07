import React, { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/admin-sidebar";
import Header from "@/components/admin-header";

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 320;

  return (
    <div>
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
        className="mt-[64px] px-[32px] py-[48px] min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}