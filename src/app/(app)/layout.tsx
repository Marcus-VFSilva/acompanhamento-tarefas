import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = (session.user as any)?.isAdmin ?? false;

  return (
    <div className="h-screen flex flex-col bg-surface-50">
      <Header
        userName={session.user?.name}
        userEmail={session.user?.email}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
