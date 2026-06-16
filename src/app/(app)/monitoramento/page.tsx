import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MonitoramentoClient from "./MonitoramentoClient";

export default async function MonitoramentoPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return <MonitoramentoClient />;
}
