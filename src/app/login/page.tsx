import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const microsoftEnabled = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
);

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session) redirect("/");

  const { error } = await searchParams;

  return <LoginClient authError={error ?? null} microsoftEnabled={microsoftEnabled} />;
}
