import { auth } from "@/auth";
import TarefasClient from "./TarefasClient";

export default async function TarefasPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin ?? false;
  const userEmail = session?.user?.email ?? "";
  const userName = session?.user?.name ?? "";

  return <TarefasClient isAdmin={isAdmin} userEmail={userEmail} userName={userName} />;
}
