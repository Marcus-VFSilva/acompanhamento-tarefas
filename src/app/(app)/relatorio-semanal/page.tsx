import { auth } from "@/auth";
import RelatorioSemanalClient from "./RelatorioSemanalClient";

export default async function RelatorioSemanalPage() {
  const session = await auth();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;
  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return <RelatorioSemanalClient isAdmin={isAdmin} userName={userName} />;
}
