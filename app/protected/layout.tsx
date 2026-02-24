// app/(protected)/layout.tsx
export const dynamic = "force-dynamic"; // <--- important

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Navbar from "@/components/navbar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("session")?.value; 

  try {
    jwt.verify(token ?? "", process.env.JWT_SECRET!);
  } catch {
    redirect("/auth/login");
  }

  return (
    <>
      <Navbar /> {/* client component is fine */}
      {children}
    </>
  );
}