import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, sessionSecret } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  // If the user already has a valid session, skip the login page
  if (verifySession(token, sessionSecret())) {
    redirect("/");
  }

  return <LoginForm />;
}
