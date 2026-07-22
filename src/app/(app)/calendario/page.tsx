import { auth } from "@/auth";
import CalendarioClient from "./CalendarioClient";

export default async function CalendarioPage() {
  const session = await auth();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  return <CalendarioClient isAdmin={isAdmin} />;
}
