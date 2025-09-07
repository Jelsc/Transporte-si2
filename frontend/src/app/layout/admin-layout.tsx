import React from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/admin-sidebar";
import Header from "@/components/admin-header";

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div>
      <div className="fixed inset-y-0 left-0 w-[320px] z-20">
        <Sidebar />
      </div>
      <div className="fixed top-0 left-[320px] right-0 h-16 z-30">
        <Header />
      </div>
      {/* Contenido principal con margen para no tapar sidebar ni header */}
      <main className="ml-[320px] mt-[64px] px-[32px] py-[48px] min-h-screen">
        {children}
      </main>
    </div>
  );
}