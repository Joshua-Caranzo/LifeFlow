import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Navbar from "@/components/navbar";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  try {
    jwt.verify(token ?? "", process.env.JWT_SECRET!);
  } catch {
    redirect("/auth/login");
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}