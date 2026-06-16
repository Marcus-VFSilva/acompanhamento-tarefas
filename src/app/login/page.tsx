import { auth, IS_DEV } from "@/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return <LoginClient isDev={IS_DEV} />;
}
