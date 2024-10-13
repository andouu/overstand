"use client";

import { ReactNode } from "react";
import { useAuth } from "../context/Auth";
import { redirect } from "next/navigation";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (user) {
    redirect("/dashboard");
  }

  if (isLoading) {
    return <div>Loading</div>;
  }

  return children;
}
