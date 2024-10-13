"use client";
import { ReactNode } from "react";
import { useAuth } from "../context/Auth";
import { redirect } from "next/navigation";
import { LoadingPage } from "../Components/LoadingPage";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    redirect("/login");
  }

  return children;
}
