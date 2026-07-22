import { auth } from "@/auth";
import ProjetoDetailClient from "./ProjetoDetailClient";

export default async function ProjetoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  return <ProjetoDetailClient projectId={id} isAdmin={isAdmin} />;
}
