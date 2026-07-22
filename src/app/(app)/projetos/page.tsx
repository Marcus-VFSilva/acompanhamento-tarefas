import { auth } from "@/auth";
import ProjetosClient from "./ProjetosClient";

export default async function ProjetosPage() {
  const session = await auth();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  return <ProjetosClient isAdmin={isAdmin} />;
}
