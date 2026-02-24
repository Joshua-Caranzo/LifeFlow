export const dynamic = "force-dynamic"; // <--- add this at top of page.tsx

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function RootPage() {
  const token = (await cookies()).get("session")?.value; 
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
      redirect("/protected");
    } catch {
      redirect("/auth/login");
    }
  }

  redirect("/auth/login");
}