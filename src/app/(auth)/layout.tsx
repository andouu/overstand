"use client";

import { ReactNode } from "react";
import { useAuth } from "../context/Auth";
import { redirect } from "next/navigation";
import { LoadingPage } from "../Components/LoadingPage";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (user) {
    redirect("/dashboard");
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  return children;
}
