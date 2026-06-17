import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
const IS_DEV = true;

export { IS_DEV };

function emailToName(email: string): string {
  return email.split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
    ...(IS_DEV
      ? [
          Credentials({
            id: "dev",
            name: "Dev Login",
            credentials: { email: { type: "email" } },
            authorize(credentials) {
              const email = (credentials?.email as string)?.trim().toLowerCase();
              if (!email || !email.includes("@")) return null;
              const name = emailToName(email);
              const isAdmin = ADMIN_EMAILS.includes(email);
              return { id: email, email, name, isAdmin };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user, account, profile }) {
      if (account?.provider === "dev" && user) {
        token.isAdmin = (user as any).isAdmin ?? false;
        return token;
      }
      if (profile) {
        token.email = ((profile as any).email ?? (profile as any).preferred_username ?? token.email) as string;
        token.name = profile.name ?? token.name;
      }
      if (token.email) {
        token.isAdmin = ADMIN_EMAILS.includes((token.email as string).toLowerCase());
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
