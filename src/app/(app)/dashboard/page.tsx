"use client";

import { useAuth } from "@/app/context/Auth";

export default function Dashboard() {
  const { signOut } = useAuth();
  return <button onClick={signOut}>Sign Out</button>;
}
