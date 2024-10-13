"use client";
import { ReactNode } from "react";
import { useAuth } from "../context/Auth";
import { redirect } from "next/navigation";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading</div>;
  }

  if (!user) {
    redirect("/login");
  }

  return children;
}
