"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AdminSedeDashboard from "./components/AdminSedeDashboard";
import { toast } from "sonner";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/users/me");
        setRole(data.rol);
        if (data.rol === "ADMIN_SEDE" || data.rol === "JEFE_SALA") {
          if (data.sedesIds && data.sedesIds.length > 0) {
            setSedeId(data.sedesIds[0].toString());
          }
        }
      } catch (error) {
        toast.error("Error al obtener información del usuario");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  if (role === "ADMIN_SEDE") {
    return <AdminSedeDashboard />;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-background text-muted-foreground">
      No tienes acceso a un dashboard o no tienes una sede asignada.
    </div>
  );
}

