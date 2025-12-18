import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
// import { NotificationInitializer } from '@/hooks/useNotificationInitializer';

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <NotificationInitializer /> */}
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default ClientLayout;
