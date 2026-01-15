import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const tenantSlug = (credentials.tenantSlug as string) || "sdis13";

        // Trouver le tenant
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });

        if (!tenant) {
          throw new Error("Organisation introuvable");
        }

        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: tenant.id,
              email: email,
            },
          },
          include: {
            tenant: true,
          },
        });

        if (!user) {
          throw new Error("Identifiants invalides");
        }

        // Vérifier le statut
        if (user.status !== "ACTIVE") {
          throw new Error("Compte désactivé");
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Identifiants invalides");
        }

        // Mettre à jour la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // Première connexion
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
      }

      // Mise à jour de session
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }: any) {
      // Connexion réussie
    },
    async signOut() {
      // Déconnexion
    },
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;
